import { Component } from '@angular/core';
import { AlertController, NavController, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Restaurant } from 'i4t_web/both/models/restaurant/restaurant.model';
import { Table } from 'i4t_web/both/models/restaurant/table.model';
import { SectionsPage } from '../sections/sections';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';

@Component({
  selector: 'page-alphanumeric-code',
  templateUrl: 'alphanumeric-code.html'
})
export class AlphanumericCodePage {

  private _userLang: string;
  private _ordersForm: FormGroup;
  private _id_table: string;
  private _error_msg: string;

  constructor(public _navCtrl: NavController, 
              public _alertCtrl: AlertController,
              private _viewCtrl: ViewController, 
              public _navParams: NavParams, 
              public _translate: TranslateService,
              private _userLanguageService: UserLanguageServiceProvider) {
    _translate.setDefaultLang('en');
  }

  ngOnInit() {
    this._translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
    this._ordersForm = new FormGroup({
      qrCode: new FormControl('', [Validators.required, Validators.minLength(6)])
    });
  }

  /**
  * This function validate if QR Code exists
  */
  validateQRCodeExists() {
    MeteorObservable.call('getIdTableByQr', this._ordersForm.value.qrCode.toString().toUpperCase()).subscribe((table: Table) => {
      if(table){
        if (table.is_active) {
          this._id_table = table._id;
          this.forwardToSections();
        } else {
          this.showConfirmMessage(this.itemNameTraduction('MOBILE.ORDERS.TABLE_NO_ACTIVE'));
        }
      } else {
        this.showConfirmMessage(this.itemNameTraduction('MOBILE.ORDERS.TABLE_NOT_EXISTS'));
      }
    });
  }

  forwardToSections() {
    if (this._id_table) {
      MeteorObservable.call('getRestaurantByQRCode', this._ordersForm.value.qrCode.toString().toUpperCase(), Meteor.userId()).subscribe((restaurant: Restaurant) => {
        if (restaurant) {
          this._navCtrl.push(SectionsPage, { res_id: restaurant._id, table_id: this._id_table }).then(() => {
            const index = this._viewCtrl.index;
            const index2 = this._viewCtrl.index - 1;
            this._navCtrl.remove(index);
            this._navCtrl.remove(index2);
          });
        } else {
          alert('Invalid table');
        }
      }, (error) => {
        if( error.error === '400' ){
          this.showConfirmMessage(this.itemNameTraduction('MOBILE.ORDERS.TABLE_NOT_EXISTS'));
        } else if( error.error === '300' ){
          this.showConfirmMessage(this.itemNameTraduction('MOBILE.ORDERS.RESTAURANT_NOT_EXISTS'));
        } else if( error.error === '200' ){
          this.showConfirmMessage(this.itemNameTraduction('MOBILE.ORDERS.IUREST_NO_ACTIVE'));
        } else if( error.error === '500' ){
          this.showConfirmMessage(this.itemNameTraduction('MOBILE.ORDERS.PENALTY') + error.reason);
        }
      });
    }
  }

  /**
   * Show message confirm
   * @param _pContent 
   */
  showConfirmMessage( _pContent :any ){
    let okBtn   = this.itemNameTraduction('MOBILE.OK'); 
    let title   = this.itemNameTraduction('MOBILE.SYSTEM_MSG'); 
  
    let prompt = this._alertCtrl.create({
      title: title,
      message: _pContent,
      buttons: [
        {
          text: okBtn,
          handler: data => {
          }
        }
      ]
    });
    prompt.present();
  }
  
  itemNameTraduction(itemName: string): string {
    var wordTraduced: string;
    this._translate.get(itemName).subscribe((res: string) => {
      wordTraduced = res;
    });
    return wordTraduced;
  }
}
