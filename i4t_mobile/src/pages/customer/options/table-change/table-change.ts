import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AlertController, LoadingController, NavController, NavParams } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { OrdersPage } from '../../orders/orders';
import { AlphanumericCodeChangePage } from './alphanumeric-code-change/alphanumeric-code-change';

import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { Tables } from 'i4t_web/both/collections/establishment/table.collection';

@Component({
    selector: 'table-change',
    templateUrl: 'table-change.html'
})

export class ChangeTablePage implements OnInit, OnDestroy {

    private _tablesSub: Subscription;
    private _table;
    private _waitMsg: string;

    private _res_code: string = '';
    private _table_code: string = '';


    constructor(public _navCtrl: NavController,
        public _navParams: NavParams,
        public _alertCtrl: AlertController,
        public _loadingCtrl: LoadingController,
        private _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone,
        private barcodeScanner: BarcodeScanner) {
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
            this._tablesSub = MeteorObservable.subscribe('getTableById', this._table_code).subscribe(() => {
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

    ionViewWillLeave() {
        this.removeSubscriptions();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions() {
        if (this._tablesSub) { this._tablesSub.unsubscribe(); }
    }

}