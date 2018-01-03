import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { LoadingController, NavController, NavParams, ToastController, AlertController } from 'ionic-angular';
import { MeteorObservable } from "meteor-rxjs";
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from "rxjs";
import { WaiterCallDetail } from 'i4t_web/both/models/restaurant/waiter-call-detail.model';
import { Orders } from 'i4t_web/both/collections/restaurant/order.collection';
import { Order } from 'i4t_web/both/models/restaurant/order.model';
import { Users } from 'i4t_web/both/collections/auth/user.collection';
import { Tables } from 'i4t_web/both/collections/restaurant/table.collection';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Table } from 'i4t_web/both/models/restaurant/table.model';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';

@Component({
    selector: 'restaurant-exit-confirm',
    templateUrl: 'restaurant-exit-confirm.html'
})

export class RestaurantExitConfirmPage implements OnInit, OnDestroy {

    private _orderSubscription: Subscription;
    private _usersSubscription: Subscription;
    private _tablesSubscription: Subscription;
    private _additionsSubscription: Subscription;

    private _call: WaiterCallDetail;
    private _orders: any;
    private _tableNumber: string;
    private _user = Meteor.userId();

    /**
 * SendOrderDetailsPage constructor
 * @param _params 
 */
    constructor(public _loadingCtrl: LoadingController,
        public _navCtrl: NavController,
        public _params: NavParams,
        public _translate: TranslateService,
        private _toastCtrl: ToastController,
        private _alertCtrl: AlertController,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone) {
        _translate.setDefaultLang('en');
        this._call = this._params.get('call');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._orderSubscription = MeteorObservable.subscribe('getOrdersByTableId', this._call.restaurant_id, this._call.table_id,
            ['ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED']).subscribe(() => {
                this._ngZone.run(() => {
                    this._orders = Orders.find({}).zone();
                });
            });
        this._usersSubscription = MeteorObservable.subscribe('getUserByTableId', this._call.restaurant_id, this._call.table_id).subscribe();
        this._tablesSubscription = MeteorObservable.subscribe('getTablesByRestaurant', this._call.restaurant_id).subscribe(() => {
            this._ngZone.run(() => {
                let _lTable: Table = Tables.collection.find({ _id: this._call.table_id }).fetch()[0];
                this._tableNumber = _lTable._number + '';
            });
        });

        this._additionsSubscription = MeteorObservable.subscribe('additionsByRestaurant', this._call.restaurant_id).subscribe();
    }


    /**
     * Return User Name
     * @param {string} _pUserId 
     */
    getUserName(_pUserId: string) {
        let _user = Users.collection.find({}).fetch().filter(u => u._id === _pUserId)[0];
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
     * Get Addition name
     * @param _pAdditionId 
     */
    getNameAddition(_pAdditionId: string): string {
        let _lAddition = Additions.collection.findOne({ _id: _pAdditionId });
        if (_lAddition) {
            return _lAddition.name;
        } else {
            return;
        }
    }

    /**
     * Cancel order user when user wants exit table
     * @param {Order} _pOrder 
     */
    cancelOrderToExitTable(_pOrder: Order): void {
        let loader = this._loadingCtrl.create({
            duration: 1000
        });
        loader.present();

        MeteorObservable.call('cancelOrderToRestaurantExit', _pOrder, this._call, this._user).subscribe(() => {
            let toast = this._toastCtrl.create({
                message: this.itemNameTraduction('MOBILE.CANCEL_ORDER.ORDER_CANCELED'),
                duration: 2500
            });
            toast.present();

            let _lOrdersToCancel: number = Orders.collection.find({
                restaurantId: this._call.restaurant_id, tableId: this._call.table_id,
                markedToCancel: { $in: [true, false] }, status: { $in: ['ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED'] }
            }).count();

            if (_lOrdersToCancel === 0) {
                this._navCtrl.pop();
            }
        }, (error) => {
            let errorMsg: string;
            if (error.error === '200') {
                errorMsg = this.itemNameTraduction('MOBILE.CANCEL_ORDER.CANCELING_ORDER_ERROR');
            } else {
                errorMsg = this.itemNameTraduction('MOBILE.CANCEL_ORDER.CANCELING_ORDER_ERROR');
            }
            this.showComfirm(errorMsg);
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._orderSubscription) { this._orderSubscription.unsubscribe(); }
        if (this._usersSubscription) { this._usersSubscription.unsubscribe(); }
        if (this._tablesSubscription) { this._tablesSubscription.unsubscribe(); }
        if (this._additionsSubscription) { this._additionsSubscription.unsubscribe(); }
    }

    /**
     * Function that allows show comfirm dialog
     * @param { any } _call 
     */
    showComfirm(_pContent: string) {
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

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }
    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}