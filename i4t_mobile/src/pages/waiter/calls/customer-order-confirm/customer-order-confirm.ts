import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AlertController, LoadingController, NavController, NavParams, ToastController, Platform } from 'ionic-angular';
import { MeteorObservable } from "meteor-rxjs";
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Subject, Observable } from "rxjs";
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { Table } from 'i4t_web/both/models/establishment/table.model';
import { Tables } from 'i4t_web/both/collections/establishment/table.collection';
import { WaiterCallDetail } from 'i4t_web/both/models/establishment/waiter-call-detail.model';
import { User } from 'i4t_web/both/models/auth/user.model';
import { Users } from 'i4t_web/both/collections/auth/user.collection';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { Item } from 'i4t_web/both/models/menu/item.model';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { Addition } from 'i4t_web/both/models/menu/addition.model';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Option } from 'i4t_web/both/models/menu/option.model';
import { Options } from 'i4t_web/both/collections/menu/option.collection';
import { OptionValue } from 'i4t_web/both/models/menu/option-value.model';
import { OptionValues } from 'i4t_web/both/collections/menu/option-value.collection';
import { Network } from '@ionic-native/network';

import { Meteor } from 'meteor/meteor';

@Component({
    selector: 'customer-order-confirm-page',
    templateUrl: 'customer-order-confirm.html'
})
export class CustomerOrderConfirm implements OnInit, OnDestroy {

    private _usersSubscription: Subscription;
    private _ordersSubscription: Subscription;
    private _tablesSubscription: Subscription;
    private _itemsSubscription: Subscription;
    private _additionsSubscription: Subscription;
    private _optionSub: Subscription;
    private _optionValuesSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _options: Observable<Option[]>;
    private _call: WaiterCallDetail;
    private _orders: any;
    private _table: any;

    private _establishmentId: string;
    private _tableId: string;

    private disconnectSubscription: Subscription;

    constructor(public _translate: TranslateService,
        public _params: NavParams,
        public _alertCtrl: AlertController,
        public _loadingCtrl: LoadingController,
        public _navCtrl: NavController,
        private _toastCtrl: ToastController,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone,
        public _platform: Platform,
        private _network: Network) {
        _translate.setDefaultLang('en');
        this._call = this._params.get('call');
        this._establishmentId = this._call.establishment_id;
        this._tableId = this._call.table_id;
    }

    ngOnInit() {
        this._usersSubscription = MeteorObservable.subscribe('getUserByTableId', this._call.establishment_id, this._call.table_id).takeUntil(this.ngUnsubscribe).subscribe();

        this._ordersSubscription = MeteorObservable.subscribe('getOrderById', this._call.order_id).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                console.log(this._call.order_id);
                this._orders = Orders.find({ _id: this._call.order_id }).zone();
            });
        });

        this._tablesSubscription = MeteorObservable.subscribe('getTablesByEstablishment', this._establishmentId).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._table = Tables.findOne({ _id: this._tableId });
            });
        });

        this._itemsSubscription = MeteorObservable.subscribe('itemsByEstablishment', this._call.establishment_id).takeUntil(this.ngUnsubscribe).subscribe();

        this._additionsSubscription = MeteorObservable.subscribe('additionsByEstablishment', this._call.establishment_id).takeUntil(this.ngUnsubscribe).subscribe();

        let _optionIds: string[] = [];
        this._optionSub = MeteorObservable.subscribe('optionsByEstablishment', [this._call.establishment_id]).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._options = Options.find({ establishments: { $in: [this._call.establishment_id] }, is_active: true }).zone();
                this._options.subscribe(() => {
                    Options.find({ establishments: { $in: [this._call.establishment_id] }, is_active: true }).fetch().forEach((opt) => {
                        _optionIds.push(opt._id);
                    });
                    this._optionValuesSub = MeteorObservable.subscribe('getOptionValuesByOptionIds', _optionIds).takeUntil(this.ngUnsubscribe).subscribe();
                });
            });
        });
    }

    /**
     * Return User Name
     * @param {string} _pUserId 
     */
    getUserName(_pUserId: string): string {
        let _msg: string = this.itemNameTraduction('MOBILE.NO_NAME');
        let _user: User = Users.findOne({ _id: _pUserId });
        if (_user) {
            if (_user.username) {
                return _user.username;
            } else {
                if (_user.services) {
                    if (_user.services.facebook) {
                        return _user.services.facebook.name;
                    } else {
                        return _msg;
                    }
                } else {
                    return _msg;
                }
            }
        } else {
            return _msg;
        }
    }

    /**
     * Return Item name
     * @param _pItemId 
     */
    getItemName(_pItemId) {
        let _lItem: Item = Items.findOne({ _id: _pItemId });
        if (_lItem) {
            return _lItem.name;
        }
    }

    /**
     * Return option value name
     * @param {string} _valueId
     */
    getOptionValueName(_valueId: string): string {
        let _option_value = OptionValues.findOne({ _id: _valueId });
        if (_option_value) {
            return _option_value.name;
        }
    }

    /**
     * Return Addition name
     * @param _pAdditionId 
     */
    getAdditionName(_pAdditionId) {
        let _lAddition: Addition = Additions.findOne({ _id: _pAdditionId });
        if (_lAddition) {
            return _lAddition.name;
        }
    }

    /**
     * Function that allows show comfirm dialog
     * @param _pType 
     */
    showComfirm(_pType: string) {
        let btn_no = this.itemNameTraduction('MOBILE.ORDERS.NO_ANSWER');
        let btn_yes = this.itemNameTraduction('MOBILE.ORDERS.YES_ANSWER');
        let title = this.itemNameTraduction('MOBILE.SYSTEM_MSG');
        let content = "";

        if (_pType === "cancel") {
            content = this.itemNameTraduction('MOBILE.CUSTOMER_ORDER.CONTENT_PROMPT');
        } else {
            content = this.itemNameTraduction('MOBILE.CUSTOMER_ORDER.RECEIVE_CONTENT_PROMPT');
        }

        let prompt = this._alertCtrl.create({
            title: title,
            message: content,
            buttons: [
                {
                    text: btn_no,
                    handler: data => {
                    }
                },
                {
                    text: btn_yes,
                    handler: data => {
                        this.orderFunction(_pType);
                    }
                }
            ]
        });
        prompt.present();
    }

    /**
     * Order detail cancel
     */
    orderFunction(_pType: string) {
        let loading_msg = this.itemNameTraduction('MOBILE.WAITER_CALL.LOADING');

        let loading = this._loadingCtrl.create({
            content: loading_msg
        });
        loading.present();

        if (_pType === 'cancel') {
            setTimeout(() => {
                this.cancelOrder().then((result) => {
                    if (result) {
                        loading.dismiss();
                        this.presentToast();
                    } else {
                        loading.dismiss();
                    }
                }).catch((err) => {
                    loading.dismiss();
                });
            }, 1500);
        } else {
            setTimeout(() => {
                this.receiveOrder().then((result) => {
                    if (result) {
                        loading.dismiss();
                        this.presentToast();
                    } else {
                        loading.dismiss();
                    }
                }).catch((err) => {
                    loading.dismiss();
                });
            }, 1500);

        }
        this._navCtrl.pop();
    }

    /**
     * Promise to close order
     */
    cancelOrder(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                MeteorObservable.call('cancelOrderCall', this._call, Meteor.userId()).subscribe(() => {
                    resolve(true);
                }, (error) => {
                    resolve(false);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Function to receive order
     */
    receiveOrder(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                MeteorObservable.call('closeCall', this._call, Meteor.userId()).subscribe(() => {
                    resolve(true);
                }, (error) => {
                    resolve(false);
                });
            } catch (e) {
                reject(e);
            }
        });

    }

    /**
     * Function that allow show a toast confirmation
     */
    presentToast() {
        let msg = this.itemNameTraduction('MOBILE.WAITER_CALL.MSG_COMFIRM');
        let toast = this._toastCtrl.create({
            message: msg,
            duration: 1500,
            position: 'middle'
        });

        toast.onDidDismiss(() => {
        });

        toast.present();
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

    /**
     * This function allow translate strings
     * @param {string} _itemName 
     */
    itemNameTraduction(_itemName: string): string {
        var wordTraduced: string;
        this._translate.get(_itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
       * ngOnDestroy Implementation
       */
    ngOnDestroy() {
        this.removeSubscriptions();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}