import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { App, NavController, NavParams, AlertController, LoadingController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Order, OrderAddition } from 'i4t_web/both/models/restaurant/order.model';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { Restaurant } from 'i4t_web/both/models/restaurant/restaurant.model';
import { Restaurants } from 'i4t_web/both/collections/restaurant/restaurant.collection';
import { Tables } from 'i4t_web/both/collections/restaurant/table.collection';
import { Orders } from 'i4t_web/both/collections/restaurant/order.collection';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { Storage } from '@ionic/storage';
import { CodeTypeSelectPage } from '../code-type-select/code-type-select';
import { SectionsPage } from '../sections/sections';
import { ItemEditPage } from '../item-edit/item-edit';
import { AdditionEditPage } from '../addition-edit/addition-edit';
import { RestaurantProfilePage } from '../restaurant-profile/restaurant-profile';
import { Currencies } from 'i4t_web/both/collections/general/currency.collection';
import { UserDetail } from '../../../../../i4t_web/both/models/auth/user-detail.model';

@Component({
    selector: 'page-orders',
    templateUrl: 'orders.html'
})
export class OrdersPage implements OnInit, OnDestroy {

    private _userDetailSub: Subscription;
    private _restaurantSub: Subscription;
    private _tablesSub: Subscription;
    private _ordersSub: Subscription;
    private _additionsSub: Subscription;
    private _itemsSub: Subscription;
    private _currencySub: Subscription;

    private _userLang: string;
    private _table_code: string = "";
    private _res_code: string = "";
    private _statusArray: string[];
    private _currentUserId: string;
    private _orderIndex: number = -1;
    private selected: string = "";
    private _currencyCode: string = "";

    private _restaurants: any;
    private _restaurant: any;
    private _table: any;
    private _additions: any;
    private _userDetail;
    private _orders;
    private _items;
    private _userDetails: Observable<UserDetail[]>;

    private _currentOrderUserId: string;
    private _btnOrderItem: boolean = true;

    private _thereIsUser: boolean = true;
    private _thereAreOrders: boolean = true;

    constructor(public _navCtrl: NavController,
        public _navParams: NavParams,
        public _app: App,
        public _translate: TranslateService,
        public alertCtrl: AlertController,
        public _loadingCtrl: LoadingController,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone) {
        _translate.setDefaultLang('en');
        this._currentUserId = Meteor.userId();
        this._statusArray = ['ORDER_STATUS.REGISTERED', 'ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED'];
        this.selected = "all";
    }

    ngOnInit() {
        this.removeSubscriptions();
        this.init();
    }

    ionViewWillEnter() {
        this.removeSubscriptions();
        this.init();
    }

    init() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetails = UserDetails.find({ user_id: Meteor.userId() }).zone();
                this.validateUser();
                this._userDetails.subscribe(() => { this.validateUser() });
                this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
                if (this._userDetail) {
                    this._res_code = this._userDetail.current_restaurant;
                    this._restaurantSub = MeteorObservable.subscribe('getRestaurantByCurrentUser', Meteor.userId()).subscribe(() => {
                        this._ngZone.run(() => {
                            this._restaurants = Restaurants.find({ _id: this._userDetail.current_restaurant }).zone();
                        });
                    });

                    this._tablesSub = MeteorObservable.subscribe('getTableById', this._userDetail.current_table).subscribe(() => {
                        this._ngZone.run(() => {
                            this._table = Tables.findOne({ _id: this._userDetail.current_table });
                        });
                    });

                    this._ordersSub = MeteorObservable.subscribe('getOrdersByUserId', Meteor.userId(), this._statusArray).subscribe(() => {
                        this._ngZone.run(() => {
                            this.getOrders();
                            this._orders = Orders.find({ restaurantId: this._userDetail.current_restaurant, tableId: this._userDetail.current_table, status: { $in: this._statusArray } });
                            this._orders.subscribe(() => { this.getOrders() });
                        });
                    });
                }
            });
        });

        this._itemsSub = MeteorObservable.subscribe('itemsByUser', Meteor.userId()).subscribe();
        this._additionsSub = MeteorObservable.subscribe('additionsByCurrentRestaurant', Meteor.userId()).subscribe();
        this._currencySub = MeteorObservable.subscribe('getCurrenciesByCurrentUser', Meteor.userId()).subscribe(() => {
            this._ngZone.run(() => {
                if (Currencies.find({}).fetch().length > 0) {
                    this._currencyCode = Currencies.find({}).fetch()[0].code;
                }
            });
        });
    }

    validateUser(): void {
        let _user: UserDetail = UserDetails.findOne({ user_id: Meteor.userId() });
        _user.current_restaurant !== '' && _user.current_table !== '' ? this._thereIsUser = true : this._thereIsUser = false;
    }

    getOrders() {
        Orders.collection.find({ restaurantId: this._userDetail.current_restaurant, tableId: this._userDetail.current_table, status: { $in: this._statusArray } }).count() > 0 ? this._thereAreOrders = true : this._thereAreOrders = false;
    }

    goToNewOrder() {
        let dialogMsg = this.itemNameTraduction('MOBILE.ORDERS.LOADING_MENU');

        this._userDetail = UserDetails.collection.findOne({ user_id: Meteor.userId() });

        if (this._userDetail.current_table == "") {
            this._navCtrl.push(CodeTypeSelectPage);
        } else {
            MeteorObservable.call('getCurrentRestaurantByUser', this._userDetail.current_restaurant).subscribe((restaurant: Restaurant) => {
                if (restaurant == null) {
                    this._navCtrl.push(CodeTypeSelectPage);

                } else {
                    let loading = this._loadingCtrl.create({
                        content: dialogMsg
                    });

                    loading.present();
                    setTimeout(() => {
                        this._navCtrl.push(SectionsPage, { res_id: restaurant._id, table_id: this._userDetail.current_table });
                        loading.dismiss();
                    }, 1500);
                }
            }, (error) => {
                alert(`Failed to get table ${error}`);
            });
        }
    }

    showDetail(i) {
        if (this._orderIndex == i) {
            this._orderIndex = -1;
        } else {
            this._orderIndex = i;
        }
    }

    ionViewDidLoad() {
    }

    filterOrders(orders_selected) {
        if (orders_selected == 'all') {
            this._orders = Orders.find({ restaurantId: this._userDetail.current_restaurant, tableId: this._userDetail.current_table, status: { $in: this._statusArray } });
            this._orderIndex = -1;
        } else if (orders_selected == 'me') {
            this._orders = Orders.find({ creation_user: this._currentUserId, restaurantId: this._userDetail.current_restaurant, tableId: this._userDetail.current_table, status: { $in: this._statusArray } });
            this._orderIndex = -1;
        } else if (orders_selected == 'other') {
            this._orderIndex = -1;
            this._orders = Orders.find({ creation_user: { $nin: [this._currentUserId] }, restaurantId: this._userDetail.current_restaurant, tableId: this._userDetail.current_table, status: { $in: this._statusArray } });
        }
    }

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    cancelOrder(_order) {
        let dialog_title = this.itemNameTraduction('MOBILE.ORDERS.CANCEL_ORDER');
        let dialog_subtitle = this.itemNameTraduction('MOBILE.ORDERS.SURE_CANCEL');
        let dialog_cancel_btn = this.itemNameTraduction('MOBILE.ORDERS.NO_ANSWER');
        let dialog_accept_btn = this.itemNameTraduction('MOBILE.ORDERS.YES_ANSWER');
        let alert_not = this.itemNameTraduction('MOBILE.ORDERS.IMPOSSIBLE_CANCEL');

        let alertCancel = this.alertCtrl.create({
            title: dialog_title,
            message: dialog_subtitle,
            buttons: [
                {
                    text: dialog_cancel_btn,
                    role: 'cancel',
                    handler: () => {
                    }
                },
                {
                    text: dialog_accept_btn,
                    handler: () => {
                        if (_order.status === 'ORDER_STATUS.REGISTERED') {
                            Orders.update({ _id: _order._id }, {
                                $set: {
                                    status: 'ORDER_STATUS.CANCELED', modification_user: Meteor.userId(),
                                    modification_date: new Date()
                                }
                            });
                            this._orderIndex = -1;
                        } else {
                            alert(alert_not);
                        }
                    }
                }
            ]
        });
        alertCancel.present();
    }

    confirmOrder(_order) {
        let dialog_title = this.itemNameTraduction('MOBILE.ORDERS.CONFIRM_ORDER');
        let dialog_subtitle = this.itemNameTraduction('MOBILE.ORDERS.SURE_CONFIRM');
        let dialog_cancel_btn = this.itemNameTraduction('MOBILE.ORDERS.NO_ANSWER');
        let dialog_accept_btn = this.itemNameTraduction('MOBILE.ORDERS.YES_ANSWER');
        let alert_not = this.itemNameTraduction('MOBILE.ORDERS.IMPOSSIBLE_CONFIRM');
        let item_not = this.itemNameTraduction('MOBILE.ORDERS.NOT_ITEM_AVAILABLE');

        let userDetailTmp = UserDetails.collection.findOne({ user_id: Meteor.userId() });

        let alertConfirm = this.alertCtrl.create({
            title: dialog_title,
            message: dialog_subtitle,
            buttons: [
                {
                    text: dialog_cancel_btn,
                    role: 'cancel',
                    handler: () => {
                    }
                },
                {
                    text: dialog_accept_btn,
                    handler: () => {
                        let _lItemsIsAvailable: boolean = true;
                        if (_order.status === 'ORDER_STATUS.REGISTERED') {
                            let _Items = _order.items;
                            _Items.forEach((item) => {
                                let _lItem = Items.findOne({ _id: item.itemId });
                                let aux = _lItem.restaurants.find(element => element.restaurantId === userDetailTmp.current_restaurant);
                                if (aux.isAvailable === false) {
                                    _lItemsIsAvailable = false
                                }
                            });
                            if (_lItemsIsAvailable) {
                                Orders.update({ _id: _order._id }, {
                                    $set: {
                                        status: 'ORDER_STATUS.IN_PROCESS', modification_user: Meteor.userId(),
                                        modification_date: new Date()
                                    }
                                }
                                );
                                this._orderIndex = -1;
                            } else {
                                alert(item_not);
                            }
                        } else {
                            alert(alert_not);
                        }
                    }
                }
            ]
        });
        alertConfirm.present();
    }

    goToItemEdit(_itemId: string, _orderItemIndex: number, _order: Order) {
        let loader = this._loadingCtrl.create({
            duration: 300
        });
        loader.present();
        let _lUserDetail = UserDetails.findOne({ user_id: Meteor.userId() });

        if (_lUserDetail.current_restaurant && _lUserDetail.current_table) {
            this._res_code = _lUserDetail.current_restaurant;
            this._table_code = _lUserDetail.current_table;
        }

        this._navCtrl.push(ItemEditPage, {
            order_id: _order._id,
            item_ord_ind: _orderItemIndex,
            item_code: _itemId,
            creation_user: _order.creation_user,
            res_code: this._res_code,
            table_code: this._table_code
        });
    }

    /**
     * Show order additions detail
     * @param {OrderAddition} _pAdition
     */
    showAdditionsDetail(_pAdition: OrderAddition, _pOrder: Order): void {
        let _lUserDetail = UserDetails.findOne({ user_id: Meteor.userId() });
        if (_lUserDetail.current_restaurant && _lUserDetail.current_table) {
            this._res_code = _lUserDetail.current_restaurant;
            this._table_code = _lUserDetail.current_table;
        }
        this._navCtrl.push(AdditionEditPage, { order_addition: _pAdition, order: _pOrder, restaurant: this._res_code, table: this._table_code });
    }


    getItemThumb(_itemId: string): string {
        let _item = Items.findOne({ _id: _itemId });
        if (_item) {
            if (_item.image) {
                return _item.image.url;
            } else {
                return 'assets/img/default-plate.png';
            }
        } else {
            return 'assets/img/default-plate.png';
        }
    }

    getItemName(_itemId: string): string {
        let _itemName = Items.findOne({ _id: _itemId }).name;
        if (_itemName) {
            return _itemName;
        }
    }

    /**
    * Function to get item avalaibility 
    */
    getItemAvailability(itemId: string): boolean {
        let _item = Items.find().fetch().filter((i) => i._id === itemId)[0];
        if (_item) {
            return (_item.restaurants.filter(r => r.restaurantId === this._res_code)[0]).isAvailable;
        }
    }

    getAdditionName(_additionId: string): string {
        let _additionName = Additions.findOne({ _id: _additionId }).name;
        if (_additionName) {
            return _additionName;
        }
    }


    ionViewDidEnter() {
    }

    ionViewDidLeave() {
    }

    ionViewWillLeave() {
        //this.removeSubscriptions();
    }

    ionViewWillUnload() {
        this.removeSubscriptions();
    }

    ngOnDestroy() {
        this.removeSubscriptions();
    }

    /**
     * Go to restaurant profile
     * @param _pRestaurant 
     */
    viewRestaurantProfile(_pRestaurant: any) {
        this._navCtrl.push(RestaurantProfilePage, { restaurant: _pRestaurant });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._restaurantSub) { this._restaurantSub.unsubscribe(); }
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._tablesSub) { this._tablesSub.unsubscribe(); }
        if (this._itemsSub) { this._itemsSub.unsubscribe(); }
        if (this._userDetailSub) { this._userDetailSub.unsubscribe(); }
        if (this._currencySub) { this._currencySub.unsubscribe(); }
        if (this._additionsSub) { this._additionsSub.unsubscribe(); }
    }
}