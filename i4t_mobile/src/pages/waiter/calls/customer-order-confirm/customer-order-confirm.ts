import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, LoadingController, NavController, NavParams, ToastController } from 'ionic-angular';
import { MeteorObservable } from "meteor-rxjs";
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from "rxjs";
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
import { GarnishFood } from 'i4t_web/both/models/menu/garnish-food.model';
import { GarnishFoodCol } from 'i4t_web/both/collections/menu/garnish-food.collection';
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
    private _garnishFoodSubscription: Subscription;

    private _call: WaiterCallDetail;
    private _orders: any;
    private _table: any;

    private _establishmentId: string;
    private _tableId: string;

    constructor(public _translate: TranslateService,
        public _params: NavParams,
        public _alertCtrl: AlertController,
        public _loadingCtrl: LoadingController,
        public _navCtrl: NavController,
        private _toastCtrl: ToastController,
        private _userLanguageService: UserLanguageServiceProvider) {
        _translate.setDefaultLang('en');
        this._call = this._params.get('call');
        this._establishmentId = this._call.establishment_id;
        this._tableId = this._call.table_id;
    }

    ngOnInit() {
        this._usersSubscription = MeteorObservable.subscribe('getUserByTableId', this._call.establishment_id, this._call.table_id).subscribe();

        this._ordersSubscription = MeteorObservable.subscribe('getOrderById', this._call.order_id).subscribe(() => {
            this._orders = Orders.find({}).zone();
        });

        this._tablesSubscription = MeteorObservable.subscribe('getTablesByEstablishment', this._establishmentId).subscribe(() => {
            this._table = Tables.findOne({ _id: this._tableId });
        });

        this._itemsSubscription = MeteorObservable.subscribe('itemsByEstablishment', this._call.establishment_id).subscribe();

        this._additionsSubscription = MeteorObservable.subscribe('additionsByEstablishment', this._call.establishment_id).subscribe();

        this._garnishFoodSubscription = MeteorObservable.subscribe('garnishFoodByEstablishment', this._call.establishment_id).subscribe();
    }

    /**
     * Return User Name
     * @param {string} _pUserId 
     */
    getUserName(_pUserId: string): string {
        let _user: User = Users.collection.find({}).fetch().filter(u => u._id === _pUserId)[0];
        if (_user) {
            if (_user.username) {
                return _user.username;
            }
            else if (_user.profile.name) {
                return _user.profile.name;
            }
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
     * Return GarnishFood name
     * @param _pGarnishFoodId 
     */
    getGarnishFoodName(_pGarnishFoodId) {
        let _lGarnishFood: GarnishFood = GarnishFoodCol.findOne({ _id: _pGarnishFoodId });
        if (_lGarnishFood) {
            return _lGarnishFood.name;
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
        
        if(_pType === "cancel"){
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
        if (this._usersSubscription) { this._usersSubscription.unsubscribe(); }
        if (this._ordersSubscription) { this._ordersSubscription.unsubscribe(); }
        if (this._tablesSubscription) { this._tablesSubscription.unsubscribe(); }
        if (this._itemsSubscription) { this._itemsSubscription.unsubscribe(); }
        if (this._additionsSubscription) { this._additionsSubscription.unsubscribe(); }
        if (this._garnishFoodSubscription) { this._garnishFoodSubscription.unsubscribe(); }
    }

}