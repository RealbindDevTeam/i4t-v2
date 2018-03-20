import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { generateQRCode, createTableCode } from '../../../../../../../../both/methods/establishment/establishment.methods';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Table } from '../../../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../../../both/collections/establishment/table.collection';
import { Parameters } from '../../../../../../../../both/collections/general/parameter.collection';
import { Parameter } from '../../../../../../../../both/models/general/parameter.model';

import * as QRious from 'qrious';

let jsPDF = require('jspdf');

@Component({
  selector: 'iu-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit, OnDestroy {

  private _user = Meteor.userId();
  private tableForm: FormGroup;
  private establishmentSub: Subscription;
  private tableSub: Subscription;
  private parameterSub: Subscription;
  private _ngUnsubscribe: Subject<void> = new Subject<void>();

  private establishments: Observable<Establishment[]>;
  private tables: Observable<Table[]>;
  private tables2: Table[];

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
    private _router: Router,
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
      establishment: new FormControl('', [Validators.required]),
      tables_number: new FormControl('', [Validators.required])
    });
    this.establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        this.establishments = Establishments.find({ creation_user: this._user }).zone();
        this.countEstablishments();
        this.establishments.subscribe(() => { this.countEstablishments(); });
      });
    });

    this.tableSub = MeteorObservable.subscribe('tables', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        this.tables = Tables.find({ creation_user: this._user }).zone();
        this.countTables();
        this.tables.subscribe(() => { this.countTables(); });
      });
    });
    this.parameterSub = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe();
    this.tooltip_msg = this.itemNameTraduction('TABLES.MSG_TOOLTIP');
  }

  /**
   * Verify if establishments exists
   */
  countEstablishments(): void {
    Establishments.collection.find({ creation_user: this._user }).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
  }

  countTables(): void {
    Tables.collection.find({ creation_user: this._user }).count() > 0 ? this._thereAreTables = true : this._thereAreTables = false;
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions(): void {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  changeEstablishment(_pEstablishment) {
    this.selectedEstablishmentValue = _pEstablishment;
    this.tableForm.controls['establishment'].setValue(_pEstablishment);
  }

  changeEstablishmentFilter(_pEstablishment) {
    if (_pEstablishment == 'All') {
      this.tables2 = Tables.collection.find({ creation_user: Meteor.userId() }).fetch();
      this.enable_print = true;
      this.tooltip_msg = this.itemNameTraduction('TABLES.MSG_TOOLTIP');
    } else {
      this.establishment_name = Establishments.findOne({ _id: _pEstablishment }).name;
      this.tables2 = Tables.collection.find({ establishment_id: _pEstablishment, creation_user: Meteor.userId() }).fetch();
      this.enable_print = false;
      this.tooltip_msg = "";
      this.show_cards = true;
      this.tables_selected = [];
    }
    this.all_checked = false;
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
    let iurest_url: string = Parameters.findOne({ name: 'iurest_url_short' }).value;

    let qr_pdf = new jsPDF("portrait", "mm", "a4");

    if (this.all_checked) {

      this.tables2.forEach(table2 => {
        auxStr = table2._number.toString();
        countVar += 1;

        if ((countVar % 2) == 1) {
          qr_pdf.setFontSize(16);
          qr_pdf.rect(55, 25, 90, 90); // empty square
          qr_pdf.text(70, 33, tableStr + auxStr);
          qr_pdf.addImage(table2.QR_URI, 'JPEG', 70, 37, 60, 60);
          qr_pdf.text(70, 105, codeStr + table2.QR_code);
          qr_pdf.setFontSize(13);
          qr_pdf.text(85, 112, iurest_url);
        } else {
          qr_pdf.setFontSize(16);
          qr_pdf.rect(55, 150, 90, 90); // empty square
          qr_pdf.text(70, 158, tableStr + auxStr);
          qr_pdf.addImage(table2.QR_URI, 'JPEG', 70, 162, 60, 60);
          qr_pdf.text(70, 230, codeStr + table2.QR_code);
          qr_pdf.setFontSize(13);
          qr_pdf.text(85, 237, iurest_url);
          qr_pdf.addPage();
        }
      });
      qr_pdf.output('save', this.establishment_name.substr(0, 15) + '_' + file_name + '.pdf');
      this.tables_selected = [];
    } else if (!this.all_checked && this.tables_selected.length > 0) {
      this.tables_selected.forEach(table2 => {
        auxStr = table2._number.toString();
        countVar += 1;

        if ((countVar % 2) == 1) {
          qr_pdf.setFontSize(16);
          qr_pdf.rect(55, 25, 90, 90); // empty square
          qr_pdf.text(70, 33, tableStr + auxStr);
          qr_pdf.addImage(table2.QR_URI, 'JPEG', 70, 37, 60, 60);
          qr_pdf.text(70, 105, codeStr + table2.QR_code);
          qr_pdf.setFontSize(13);
          qr_pdf.text(85, 112, iurest_url);
        } else {
          qr_pdf.setFontSize(16);
          qr_pdf.rect(55, 150, 90, 90); // empty square
          qr_pdf.text(70, 158, tableStr + auxStr);
          qr_pdf.addImage(table2.QR_URI, 'JPEG', 70, 162, 60, 60);
          qr_pdf.text(70, 230, codeStr + table2.QR_code);
          qr_pdf.setFontSize(13);
          qr_pdf.text(85, 237, iurest_url);
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

  /**
   * Go to add new Establishment
   */
  goToAddEstablishment() {
    this._router.navigate(['/app/establishment-register']);
  }

  itemNameTraduction(itemName: string): string {
    var wordTraduced: string;
    this.translate.get(itemName).subscribe((res: string) => {
      wordTraduced = res;
    });
    return wordTraduced;
  }
}
