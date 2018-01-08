import { Component } from '@angular/core';
import { App, AlertController, LoadingController, NavController, NavParams, ViewController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MeteorObservable } from 'meteor-rxjs';
import { Establishment } from 'i4t_web/both/models/establishment/establishment.model';
import { Table } from 'i4t_web/both/models/establishment/table.model';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { AlphanumericCodePage } from '../alphanumeric-code/alphanumeric-code';
import { SectionsPage } from '../sections/sections';

@Component({
  selector: 'page-code-type-select',
  templateUrl: 'code-type-select.html'
})
export class CodeTypeSelectPage {

  private _userLang: string;
  private _id_table: string;
  private _waitMsg: string;

  /**
   * CodeTypeSelectPage constructor
   * @param _navCtrl 
   * @param _viewCtrl 
   * @param _navParams 
   * @param _translate 
   * @param _alertCtrl 
   * @param _loadingCtrl 
   * @param _app 
   * @param _userLanguageService 
   */
  constructor(private _navCtrl: NavController,
    private _viewCtrl: ViewController,
    public _navParams: NavParams,
    public _translate: TranslateService,
    public _alertCtrl: AlertController,
    public _loadingCtrl: LoadingController,
    public _app: App,
    private _userLanguageService: UserLanguageServiceProvider,
    private barcodeScanner: BarcodeScanner) {
    _translate.setDefaultLang('en');
  }

  /**
   * ngOnInit implementation
   */
  ngOnInit() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
  }

  goToScann() {
    this.barcodeScanner.scan().then((result) => {
      this.goToSections(result.text);
    }, (err) => {
      // An error occurred
    });

    this._waitMsg = this.itemNameTraduction('MOBILE.SECTIONS.WAIT_QR');
    let loader = this._loadingCtrl.create({
      duration: 500
    });
    loader.present();
  }

  goToSections(qr_code: string) {
    MeteorObservable.call('getIdTableByQr', qr_code).subscribe((table: Table) => {
      if (table) {
        if (table.is_active) {
          this._id_table = table._id;
          this.forwardToSections(qr_code);
        } else {
          this.showConfirmMessage(this.itemNameTraduction('MOBILE.ORDERS.TABLE_NO_ACTIVE'));
        }
      } else {
        this.showConfirmMessage(this.itemNameTraduction('MOBILE.ORDERS.TABLE_NOT_EXISTS'));
      }
    });
  }

  forwardToSections(qr_code: string) {
    if (this._id_table) {
      MeteorObservable.call('getEstablishmentByQRCode', qr_code, Meteor.userId()).subscribe((establishment: Establishment) => {

        if (establishment) {
          this._navCtrl.push(SectionsPage, { res_id: establishment._id, table_id: this._id_table }).then(() => {
            const index = this._viewCtrl.index;
            this._navCtrl.remove(index);
          });
        } else {
          alert('Invalid table');
        }
      }, (error) => {
        if (error.error === '400') {
          this.showConfirmMessage(this.itemNameTraduction('MOBILE.ORDERS.TABLE_NOT_EXISTS'));
        } else if (error.error === '300') {
          this.showConfirmMessage(this.itemNameTraduction('MOBILE.ORDERS.RESTAURANT_NOT_EXISTS'));
        } else if (error.error === '200') {
          this.showConfirmMessage(this.itemNameTraduction('MOBILE.ORDERS.IUREST_NO_ACTIVE'));
        } else if (error.error === '500') {
          this.showConfirmMessage(this.itemNameTraduction('MOBILE.ORDERS.PENALTY') + error.reason);
        }
      });
    }
  }

  /**
   * Show message confirm
   * @param _pContent 
   */
  showConfirmMessage(_pContent: any) {
    let okBtn = this.itemNameTraduction('MOBILE.OK');
    let title = this.itemNameTraduction('MOBILE.SYSTEM_MSG');

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

  goToAlphanumericCode() {
    this._navCtrl.push(AlphanumericCodePage);
  }

  itemNameTraduction(itemName: string): string {
    var wordTraduced: string;
    this._translate.get(itemName).subscribe((res: string) => {
      wordTraduced = res;
    });
    return wordTraduced;
  }
}
