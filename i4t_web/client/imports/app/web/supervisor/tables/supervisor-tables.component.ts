import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../services/general/user-language.service';
import { generateQRCode, createTableCode } from '../../../../../../both/methods/restaurant/restaurant.methods';
import { Restaurant } from '../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../both/collections/restaurant/restaurant.collection';
import { Table } from '../../../../../../both/models/restaurant/table.model';
import { Tables } from '../../../../../../both/collections/restaurant/table.collection';

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
  private restaurantSub: Subscription;
  private tableSub: Subscription;

  private restaurants: Observable<Restaurant[]>;
  private tables: Observable<Table[]>;

  selectedRestaurantValue: string;
  private restaurantCode: string = '';
  private tables_count: number = 0;
  private all_checked: boolean;
  private enable_print: boolean;
  private restaurant_name: string = '';

  private tables_selected: Table[];
  private isChecked: false;
  private tooltip_msg: string = '';
  private show_cards: boolean;
  finalImg: any;
  private _thereAreRestaurants: boolean = true;
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
    this.selectedRestaurantValue = "";
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
      restaurant: new FormControl('', [Validators.required]),
      tables_number: new FormControl('', [Validators.required])
    });
    this.restaurantSub = MeteorObservable.subscribe('getRestaurantByRestaurantWork', this._user).subscribe(() => {
      this._ngZone.run(() => {
        this.restaurants = Restaurants.find({}).zone();
        this.countRestaurants();
        this.restaurants.subscribe(() => { this.countRestaurants(); });
        Restaurants.find().fetch().forEach((res) => {
          this.restaurant_name = res.name;
        });
        this.enable_print = false;
        this.tooltip_msg = "";
        this.show_cards = true;
        this.tables_selected = [];
        this.all_checked = false;
      });
    });
    this.tableSub = MeteorObservable.subscribe('getTablesByRestaurantWork', this._user).subscribe(() => {
      this._ngZone.run(() => {
        this.tables = Tables.find({}).zone();
        this.countTables();
        this.tables.subscribe(() => { this.countTables(); });
      });
    });
    this.tooltip_msg = this.itemNameTraduction('TABLES.MSG_TOOLTIP');
  }

  /**
   * Verify if restaurants exists
   */
  countRestaurants(): void {
    Restaurants.collection.find({}).count() > 0 ? this._thereAreRestaurants = true : this._thereAreRestaurants = false;
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
    if (this.restaurantSub) { this.restaurantSub.unsubscribe(); }
    if (this.tableSub) { this.tableSub.unsubscribe(); }
  }

  cancel(): void {
    if (this.selectedRestaurantValue !== "") { this.selectedRestaurantValue = ""; }
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
      qr_pdf.output('save', this.restaurant_name.substr(0, 15) + '_' + file_name + '.pdf');
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
      qr_pdf.output('save', this.restaurant_name.substr(0, 15) + '_' + file_name + '.pdf');
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