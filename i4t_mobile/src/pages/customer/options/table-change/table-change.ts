import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AlertController, LoadingController, NavController, NavParams, Platform } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Subject } from 'rxjs';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { OrdersPage } from '../../orders/orders';
import { AlphanumericCodeChangePage } from './alphanumeric-code-change/alphanumeric-code-change';

import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { Tables } from 'i4t_web/both/collections/establishment/table.collection';
import { Network } from '@ionic-native/network';

@Component({
    selector: 'table-change',
    templateUrl: 'table-change.html'
})

export class ChangeTablePage implements OnInit, OnDestroy {

    private _tablesSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    private _table;
    private _waitMsg: string;

    private _res_code: string = '';
    private _table_code: string = '';

    private disconnectSubscription: Subscription;

    constructor(public _navCtrl: NavController,
        public _navParams: NavParams,
        public _alertCtrl: AlertController,
        public _loadingCtrl: LoadingController,
        private _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone,
        private barcodeScanner: BarcodeScanner,
        public _platform: Platform,
        private _network: Network) {
        _translate.setDefaultLang('en');

        this._res_code = this._navParams.get("res_id");
        this._table_code = this._navParams.get("table_id");
    }

    ngOnInit() {
        this.init();
    }

    ionViewWillEnter() {
        this.init();
    }

    init() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        if (this._res_code !== '' && this._table_code !== '') {
            this._tablesSub = MeteorObservable.subscribe('getTableById', this._table_code).takeUntil(this.ngUnsubscribe).subscribe(() => {
                this._ngZone.run(() => {
                    this._table = Tables.findOne({ _id: this._table_code });
                })
            });
        }
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
        MeteorObservable.call('changeCurrentTable', Meteor.userId(), this._res_code, this._table.QR_code, qr_code).subscribe(() => {
            this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.CHANGE_TABLE_OK'));
            this._navCtrl.setRoot(OrdersPage);
        }, (error) => {
            if (error.error === '200') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.TABLE_DESTINY_NOT_EXISTS'));
            } else if (error.error === '201') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.TABLE_DESTINY_NO_ACTIVE'));
            } else if (error.error === '202') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.TABLE_DESTINY_NO_RESTAURANT'));
            } else if (error.error === '205') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.WAITER_CALL_PENDING'));
            } else if (error.error === '206') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.TABLE_DESTINY_STATUS_ERROR'));
            } else if (error.error === '207') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.SAME_TABLE_ERROR'));
            } else {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.GENERAL_ERROR'));
            }
        });
    }

    /**
   * Show message confirm
   * @param _pContent 
   */
    showConfirmMessage(_pContent: any) {
        let okBtn = this.itemNameTraduction('MOBILE.OK');
        let title = this.itemNameTraduction('MOBILE.CHANGE_TABLE.DIALOG_ALERT');

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
        this.removeSubscriptions();
        this.disconnectSubscription.unsubscribe();
    }

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    goToAlphanumericCode() {
        this._navCtrl.push(AlphanumericCodeChangePage, { res_id: this._res_code, table_id: this._table_code });
    }

    ngOnDestroy() {
        this.removeSubscriptions();
    }
    /**
     * Remove all subscriptions
     */
    removeSubscriptions() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}