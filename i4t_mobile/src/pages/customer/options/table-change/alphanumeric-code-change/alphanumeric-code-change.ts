import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AlertController, NavController, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageServiceProvider } from '../../../../../providers/user-language-service/user-language-service';
import { Tables } from 'i4t_web/both/collections/establishment/table.collection';
import { TabsPage } from '../../../tabs/tabs';

@Component({
    selector: 'alphanumeric-code-change',
    templateUrl: 'alphanumeric-code-change.html'
})

export class AlphanumericCodeChangePage {

    private _ordersForm: FormGroup;
    private _tablesSub: Subscription;
    private _res_code: string = '';
    private _table_code: string = '';
    private _table;


    constructor(public _navCtrl: NavController,
        public _alertCtrl: AlertController,
        private _viewCtrl: ViewController,
        public _navParams: NavParams,
        public _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone) {
        _translate.setDefaultLang('en');

        this._res_code = this._navParams.get("res_id");
        this._table_code = this._navParams.get("table_id");
    }

    ngOnInit() {
        this.removeSubscriptions();
        this.init();
    }

    ionViewWillEnter() {
        this.init();
    }

    init() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this._ordersForm = new FormGroup({
            qrCode: new FormControl('', [Validators.required, Validators.minLength(6)])
        });
        if (this._res_code !== '' && this._table_code !== '') {
            this._tablesSub = MeteorObservable.subscribe('getTableById', this._table_code).subscribe(() => {
                this._ngZone.run(() => {
                    this._table = Tables.findOne({ _id: this._table_code });
                })
            });
        }
    }

    validateQRCodeExists() {
        MeteorObservable.call('changeCurrentTable', Meteor.userId(), this._res_code, this._table.QR_code, this._ordersForm.value.qrCode.toString().toUpperCase()).subscribe(() => {
            this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.CHANGE_TABLE_OK'));
            this._navCtrl.setRoot(TabsPage);
        }, (error) => {
            if (error.error === '200') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.TABLE_DESTINY_NOT_EXISTS'));
            } else if (error.error === '201') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.TABLE_DESTINY_NO_ACTIVE'));
            } else if (error.error === '202') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.TABLE_DESTINY_NO_RESTAURANT'));
            } else if (error.error === '203') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.PENDING_ORDERS'));
            } else if (error.error === '204') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.CHANGE_TABLE.ORDERS_PAY_PROCESS'));
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