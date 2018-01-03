import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { generateQRCode, createTableCode } from '../../../../../../../../both/methods/restaurant/restaurant.methods';
import { Restaurant } from '../../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../../../both/collections/restaurant/restaurant.collection';
import { Table } from '../../../../../../../../both/models/restaurant/table.model';
import { Tables } from '../../../../../../../../both/collections/restaurant/table.collection';
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
  private restaurantSub: Subscription;
  private tableSub: Subscription;
  private parameterSub: Subscription;

  private restaurants: Observable<Restaurant[]>;
  private tables: Observable<Table[]>;
  private tables2: Table[];

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
    private _router: Router,
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
    this.restaurantSub = MeteorObservable.subscribe('restaurants', this._user).subscribe(() => {
      this._ngZone.run(() => {
        this.restaurants = Restaurants.find({ creation_user: this._user }).zone();
        this.countRestaurants();
        this.restaurants.subscribe(() => { this.countRestaurants(); });
      });
    });

    this.tableSub = MeteorObservable.subscribe('tables', this._user).subscribe(() => {
      this._ngZone.run(() => {
        this.tables = Tables.find({ creation_user: this._user }).zone();
        this.countTables();
        this.tables.subscribe(() => { this.countTables(); });
      });
    });
    this.parameterSub = MeteorObservable.subscribe('getParameters').subscribe();
    this.tooltip_msg = this.itemNameTraduction('TABLES.MSG_TOOLTIP');
  }

  /**
   * Verify if restaurants exists
   */
  countRestaurants(): void {
    Restaurants.collection.find({ creation_user: this._user }).count() > 0 ? this._thereAreRestaurants = true : this._thereAreRestaurants = false;
  }

  countTables(): void {
    Tables.collection.find({ creation_user: this._user }).count() > 0 ? this._thereAreTables = true : this._thereAreTables = false;
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions(): void {
    if (this.restaurantSub) { this.restaurantSub.unsubscribe(); }
    if (this.tableSub) { this.tableSub.unsubscribe(); }
  }

  changeRestaurant(_pRestaurant) {
    this.selectedRestaurantValue = _pRestaurant;
    this.tableForm.controls['restaurant'].setValue(_pRestaurant);
  }

  changeRestaurantFilter(_pRestaurant) {
    if (_pRestaurant == 'All') {
      this.tables2 = Tables.collection.find({ creation_user: Meteor.userId() }).fetch();
      this.enable_print = true;
      this.tooltip_msg = this.itemNameTraduction('TABLES.MSG_TOOLTIP');
    } else {
      this.restaurant_name = Restaurants.findOne({ _id: _pRestaurant }).name;
      this.tables2 = Tables.collection.find({ restaurantId: _pRestaurant, creation_user: Meteor.userId() }).fetch();
      this.enable_print = false;
      this.tooltip_msg = "";
      this.show_cards = true;
      this.tables_selected = [];
    }
    this.all_checked = false;
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
      qr_pdf.output('save', this.restaurant_name.substr(0, 15) + '_' + file_name + '.pdf');
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

  /**
   * Go to add new Restaurant
   */
  goToAddRestaurant() {
    this._router.navigate(['/app/restaurant-register']);
  }

  itemNameTraduction(itemName: string): string {
    var wordTraduced: string;
    this.translate.get(itemName).subscribe((res: string) => {
      wordTraduced = res;
    });
    return wordTraduced;
  }
}
