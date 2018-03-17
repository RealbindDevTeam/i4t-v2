import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../services/general/user-language.service';
import { generateQRCode, createTableCode } from '../../../../../../both/methods/establishment/establishment.methods';
import { Establishment } from '../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../both/collections/establishment/establishment.collection';
import { Table } from '../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../both/collections/establishment/table.collection';

import * as QRious from 'qrious';
let jsPDF = require('jspdf');

@Component({
  selector: 'sup-tables',
  templateUrl: './supervisor-tables.component.html',
  styleUrls: ['./supervisor-tables.component.scss']
})
export class SupervisorTableComponent implements OnInit, OnDestroy {

  private _user = Meteor.userId();
  private tableForm: FormGroup;
  private establishmentSub: Subscription;
  private tableSub: Subscription;
  private _ngUnsubscribe: Subject<void> = new Subject<void>();

  private establishments: Observable<Establishment[]>;
  private tables: Observable<Table[]>;

  private selectedEstablishmentValue: string;
  private tables_count: number = 0;
  private all_checked: boolean;
  private enable_print: boolean;
  private establishment_name: string = '';

  private tables_selected: Table[];
  private isChecked: false;
  private tooltip_msg: string = '';
  private show_cards: boolean;
  finalImg: any;
  private _thereAreEstablishments: boolean = true;
  private _thereAreTables: boolean = true;

  /**
   * TableComponent Constructor
   * @param {FormBuilder} _formBuilder 
   * @param {TranslateService} translate 
   * @param {Router} _router 
   * @param {UserLanguageService} _userLanguageService 
   */
  constructor(private _formBuilder: FormBuilder,
    private translate: TranslateService,
    private _ngZone: NgZone,
    private _userLanguageService: UserLanguageService) {
    translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    translate.setDefaultLang('en');
    this.selectedEstablishmentValue = "";
    this.tables_selected = [];
    this.all_checked = false;
    this.enable_print = true;
    this.show_cards = false;
  }

  /**
   * ngOnInit Implementation
   */
  ngOnInit() {
    this.removeSubscriptions();
    this.tableForm = new FormGroup({
      tables_number: new FormControl('', [Validators.required])
    });
    this.establishmentSub = MeteorObservable.subscribe('getEstablishmentByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        this.establishments = Establishments.find({}).zone();
        this.countEstablishments();
        this.establishments.subscribe(() => { this.countEstablishments(); });
        Establishments.find().fetch().forEach((res) => {
          this.establishment_name = res.name;
        });
        this.enable_print = false;
        this.tooltip_msg = "";
        this.show_cards = true;
        this.tables_selected = [];
        this.all_checked = false;
      });
    });
    this.tableSub = MeteorObservable.subscribe('getTablesByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        this.tables = Tables.find({}).zone();
        this.countTables();
        this.tables.subscribe(() => { this.countTables(); });
      });
    });
    this.tooltip_msg = this.itemNameTraduction('TABLES.MSG_TOOLTIP');
  }

  /**
   * Verify if establishments exists
   */
  countEstablishments(): void {
    Establishments.collection.find({}).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
  }

  /**
   * Verify if tables exists
   */
  countTables(): void {
    Tables.collection.find({}).count() > 0 ? this._thereAreTables = true : this._thereAreTables = false;
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions(): void {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  cancel(): void {
    if (this.selectedEstablishmentValue !== "") { this.selectedEstablishmentValue = ""; }
    this.tableForm.controls['tables_number'].reset();
  }

  generateTableCode(): string {
    let _lCode: string = '';

    while (true) {
      _lCode = createTableCode();
      if (Tables.find({ table_code: _lCode }).cursor.count() === 0) {
        break;
      }
    }
    return _lCode;
  }

  /**
   * ngOnDestroy Implementation
   */
  ngOnDestroy() {
    this.removeSubscriptions();
  }

  printQrPdf() {

    let auxStr: string;
    let tableStr: string = this.itemNameTraduction('TABLES.TABLE');
    let codeStr: string = this.itemNameTraduction('TABLES.CODE');
    let file_name = this.itemNameTraduction('TABLES.FILE_NAME');
    let countVar: number = 0;

    let qr_pdf = new jsPDF("portrait", "mm", "a4");

    if (this.all_checked) {

      this.tables.forEach(table => {
        table.forEach(table2 => {
          auxStr = table2._number.toString();
          countVar += 1;

          if ((countVar % 2) == 1) {
            qr_pdf.rect(55, 25, 90, 90); // empty square
            qr_pdf.text(70, 35, tableStr + auxStr);
            qr_pdf.addImage(table2.QR_URI, 'JPEG', 70, 40, 60, 60);
            qr_pdf.text(70, 110, codeStr + table2.QR_code);
          } else {
            qr_pdf.rect(55, 150, 90, 90); // empty square
            qr_pdf.text(70, 160, tableStr + auxStr);
            qr_pdf.addImage(table2.QR_URI, 'JPEG', 70, 165, 60, 60);
            qr_pdf.text(70, 235, codeStr + table2.QR_code);
            qr_pdf.addPage();
          }
        });
      });
      this.tables_selected = [];
      qr_pdf.output('save', this.establishment_name.substr(0, 15) + '_' + file_name + '.pdf');
    } else if (!this.all_checked && this.tables_selected.length > 0) {
      this.tables_selected.forEach(table2 => {
        auxStr = table2._number.toString();
        countVar += 1;

        if ((countVar % 2) == 1) {
          qr_pdf.rect(55, 25, 90, 90); // empty square
          qr_pdf.text(70, 35, tableStr + auxStr);
          qr_pdf.addImage(table2.QR_URI, 'JPEG', 70, 40, 60, 60);
          qr_pdf.text(70, 110, codeStr + table2.QR_code);
        } else {
          qr_pdf.rect(55, 150, 90, 90); // empty square
          qr_pdf.text(70, 160, tableStr + auxStr);
          qr_pdf.addImage(table2.QR_URI, 'JPEG', 70, 165, 60, 60);
          qr_pdf.text(70, 235, codeStr + table2.QR_code);
          qr_pdf.addPage();
        }
      });
      qr_pdf.output('save', this.establishment_name.substr(0, 15) + '_' + file_name + '.pdf');
    }
    //qr_pdf.save('qr_codes.pdf');
  }

  addToPrintArray(selected, isChecked: boolean) {
    if (isChecked) {
      this.tables_selected.push(selected);
    } else {
      this.tables_selected = this.tables_selected.filter(function (element) {
        return element._id !== selected._id;
      });
    }
  }

  itemNameTraduction(itemName: string): string {
    var wordTraduced: string;
    this.translate.get(itemName).subscribe((res: string) => {
      wordTraduced = res;
    });
    return wordTraduced;
  }
}