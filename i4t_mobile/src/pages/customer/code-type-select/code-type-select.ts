import { Component } from '@angular/core';
import { App, AlertController, LoadingController, NavController, NavParams, ViewController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MeteorObservable } from 'meteor-rxjs';
import { Establishment } from 'i4t_web/both/models/establishment/establishment.model';
import { Table } from 'i4t_web/both/models/establishment/table.model';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { AlphanumericCodePage } from '../alphanumeric-code/alphanumeric-code';
import { SectionsPage } from '../sections/sections';
import { Network } from '@ionic-native/network';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'page-code-type-select',
  templateUrl: 'code-type-select.html'
})
export class CodeTypeSelectPage {

  private _userLang: string;
  private _id_table: string;
  private _waitMsg: string;

  private disconnectSubscription: Subscription;

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
    private barcodeScanner: BarcodeScanner,
    public _platform: Platform,
    private _network: Network) {
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

  goToSections(_pQRCode: string) {

    var split = _pQRCode.split('qr?', 2);
    var qr_code: string = split[1];
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

  /** 
         * This function verify the conditions on page did enter for internet and server connection
        */
  ionViewDidEnter() {
    this.isConnected();
    this.disconnectSubscription = this._network.onDisconnect().subscribe(data => {
      let title = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.TITLE');
      let subtitle = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.SUBTITLE');
      let btn = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.BTN');
      this.presentAlert(title, subtitle, btn);
    }, error => console.error(error));
  }

  /** 
   * This function verify with network plugin if device has internet connection
  */
  isConnected() {
    if (this._platform.is('cordova')) {
      let conntype = this._network.type;
      let validateConn = conntype && conntype !== 'unknown' && conntype !== 'none';
      if (!validateConn) {
        let title = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.TITLE');
        let subtitle = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.SUBTITLE');
        let btn = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.BTN');
        this.presentAlert(title, subtitle, btn);
      } else {
        if (!Meteor.status().connected) {
          let title2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.TITLE');
          let subtitle2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.SUBTITLE');
          let btn2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.BTN');
          this.presentAlert(title2, subtitle2, btn2);
        }
      }
    }
  }

  /**
   * Present the alert for advice to internet
  */
  presentAlert(_pTitle: string, _pSubtitle: string, _pBtn: string) {
    let alert = this._alertCtrl.create({
      title: _pTitle,
      subTitle: _pSubtitle,
      enableBackdropDismiss: false,
      buttons: [
        {
          text: _pBtn,
          handler: () => {
            this.isConnected();
          }
        }
      ]
    });
    alert.present();
  }

  ionViewWillLeave() {
    this.disconnectSubscription.unsubscribe();
  }

  itemNameTraduction(itemName: string): string {
    var wordTraduced: string;
    this._translate.get(itemName).subscribe((res: string) => {
      wordTraduced = res;
    });
    return wordTraduced;
  }
}
