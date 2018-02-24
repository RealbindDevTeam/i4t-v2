import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { NavController, LoadingController, ToastController, AlertController, ViewController } from 'ionic-angular';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { UserDetail, UserRewardPoints } from 'i4t_web/both/models/auth/user-detail.model';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Order, OrderAddition } from 'i4t_web/both/models/establishment/order.model';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { GarnishFoodCol } from "i4t_web/both/collections/menu/garnish-food.collection";
import { Currencies } from 'i4t_web/both/collections/general/currency.collection';
import { RewardPoints } from 'i4t_web/both/collections/establishment/reward-point.collection';
import { ItemEditPage } from '../../item-edit/item-edit';
import { AdditionEditPage } from '../../addition-edit/addition-edit';
import { SegmentsPage } from '../../segments/segments';

@Component({
    selector: 'order-confirm',
    templateUrl: 'order-confirm.html'
})
export class OrderConfirmPage implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _userDetailSub: Subscription;
    private _ordersSub: Subscription;
    private _itemsSub: Subscription;
    private _additionsSub: Subscription;
    private _garnishFoodSub: Subscription;
    private _currencySub: Subscription;
    private _rewardPointsSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _orders: Observable<Order[]>;

    private _userDetail: UserDetail;
    private _currencyCode: string = "";
    private _statusArray: string[] = ['ORDER_STATUS.SELECTING'];
    private _res_code: string = "";
    private _table_code: string = "";
    private _toastMsg: string = "";

    /**
     * OrderConfirmPage constructor
     * @param {TranslateService} _translate 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {NgZone} _ngZone 
     */
    constructor(public _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        public _loadingCtrl: LoadingController,
        public _navCtrl: NavController,
        private _ngZone: NgZone,
        private toastCtrl: ToastController,
        public alertCtrl: AlertController,
        private _viewCtrl: ViewController) {
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
    }

    ionViewWillEnter() {
        this.removeSubscriptions();
        this.init();
    }

    init() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', this._user).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetail = UserDetails.findOne({ user_id: this._user });
                if (this._userDetail) {
                    this._res_code = this._userDetail.current_establishment
                    this._ordersSub = MeteorObservable.subscribe('getOrdersByUserId', this._user, this._statusArray).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._ngZone.run(() => {
                            this._orders = Orders.find({ creation_user: this._user, establishment_id: this._userDetail.current_establishment, tableId: this._userDetail.current_table, status: { $in: this._statusArray } });
                        });
                    });
                    this._rewardPointsSub = MeteorObservable.subscribe('getRewardPointsByUserId', this._user).takeUntil(this.ngUnsubscribe).subscribe();
                }
            });
        });
        this._itemsSub = MeteorObservable.subscribe('itemsByUser', this._user).takeUntil(this.ngUnsubscribe).subscribe();
        this._additionsSub = MeteorObservable.subscribe('additionsByCurrentEstablishment', this._user).takeUntil(this.ngUnsubscribe).subscribe();
        this._garnishFoodSub = MeteorObservable.subscribe('garnishFoodByCurrentEstablishment', this._user).takeUntil(this.ngUnsubscribe).subscribe();
        this._currencySub = MeteorObservable.subscribe('getCurrenciesByCurrentUser', this._user).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                if (Currencies.find({}).fetch().length > 0) {
                    this._currencyCode = Currencies.find({}).fetch()[0].code;
                }
            });
        });
    }

    /**
     * Remove all suscriptions
     */
    removeSubscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * Return item image
     * @param {string} _itemId 
     */
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

    /**
     * Return item name
     * @param {string} _itemId 
     */
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
            return (_item.establishments.filter(r => r.establishment_id === this._res_code)[0]).isAvailable;
        }
    }

    /**
     * Go to item edit component
     * @param {string} _itemId 
     * @param {number} _orderItemIndex 
     * @param {Order} _order 
     */
    goToItemEdit(_itemId: string, _orderItemIndex: number, _order: Order) {
        let loader = this._loadingCtrl.create({
            duration: 300
        });
        loader.present();
        let _lUserDetail = UserDetails.findOne({ user_id: Meteor.userId() });

        if (_lUserDetail.current_establishment && _lUserDetail.current_table) {
            this._res_code = _lUserDetail.current_establishment;
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
     * Return garnish food name
     * @param {string} _garnishFoodId 
     */
    getGarnishFoodName(_garnishFoodId: string): string {
        let _garnishFoodName = GarnishFoodCol.findOne({ _id: _garnishFoodId });
        if (_garnishFoodName) {
            return _garnishFoodName.name;
        }
    }

    /**
     * Return addition name
     * @param {string} _additionId 
     */
    getAdditionName(_additionId: string): string {
        let _additionName = Additions.findOne({ _id: _additionId });
        if (_additionName) {
            return _additionName.name;
        }
    }

    /**
     * Show order additions detail
     * @param {OrderAddition} _pAdition
     */
    showAdditionsDetail(_pAdition: OrderAddition, _pOrder: Order): void {
        let _lUserDetail = UserDetails.findOne({ user_id: Meteor.userId() });
        if (_lUserDetail.current_establishment && _lUserDetail.current_table) {
            this._res_code = _lUserDetail.current_establishment;
            this._table_code = _lUserDetail.current_table;
        }
        this._navCtrl.push(AdditionEditPage, { order_addition: _pAdition, order: _pOrder, establishment: this._res_code, table: this._table_code });
    }

    confirmOrder() {
        let _order: Order = Orders.findOne({ creation_user: this._user, establishment_id: this._userDetail.current_establishment, tableId: this._userDetail.current_table, status: { $in: this._statusArray } });
        let dialog_title = this.itemNameTraduction('MOBILE.ORDERS.CONFIRM_ORDER');
        let dialog_subtitle = this.itemNameTraduction('MOBILE.ORDERS.SURE_CONFIRM');
        let dialog_cancel_btn = this.itemNameTraduction('MOBILE.ORDERS.NO_ANSWER');
        let dialog_accept_btn = this.itemNameTraduction('MOBILE.ORDERS.YES_ANSWER');
        let alert_not = this.itemNameTraduction('MOBILE.ORDERS.IMPOSSIBLE_CONFIRM');
        let item_not = this.itemNameTraduction('MOBILE.ORDERS.NOT_ITEM_AVAILABLE');
        let _loadingMsg = this.itemNameTraduction('MOBILE.ORDERS.ORDER_CONFIRM');

        let userDetailTmp = UserDetails.collection.findOne({ user_id: this._user });

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
                        let loading = this._loadingCtrl.create({
                            content: _loadingMsg
                        });
                        if (_order.status === 'ORDER_STATUS.SELECTING') {
                            let _Items = _order.items;
                            _Items.forEach((item) => {
                                let _lItem = Items.findOne({ _id: item.itemId });
                                let aux = _lItem.establishments.find(element => element.establishment_id === userDetailTmp.current_establishment);
                                if (aux.isAvailable === false) {
                                    _lItemsIsAvailable = false
                                }
                            });
                            if (_lItemsIsAvailable) {
                                var data: any = {
                                    establishments: _order.establishment_id,
                                    tables: _order.tableId,
                                    user: Meteor.userId(),
                                    waiter_id: "",
                                    status: "waiting",
                                    type: "CUSTOMER_ORDER",
                                    order_id: _order._id
                                }

                                loading.present();

                                setTimeout(() => {
                                    MeteorObservable.call('findQueueByEstablishment', data).subscribe(() => {
                                        Orders.update({ _id: _order._id }, { $set: { status: 'ORDER_STATUS.CONFIRMED', modification_user: Meteor.userId(), modification_date: new Date() } });
                                        this._navCtrl.push(SegmentsPage).then(() => {
                                            const index = this._viewCtrl.index;
                                            const index2 = this._viewCtrl.index - 1;
                                            const index3 = this._viewCtrl.index - 2;
                                            this._navCtrl.remove(index);
                                            this._navCtrl.remove(index2);
                                            this._navCtrl.remove(index3);
                                        });

                                        loading.dismiss();
                                        this.presentToast();
                                    }, (error) => {
                                        alert(`Error: ${error}`);
                                    });
                                }, 1500);
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

    cancelOrder() {
        let _order: Order = Orders.findOne({ creation_user: this._user, establishment_id: this._userDetail.current_establishment, tableId: this._userDetail.current_table, status: { $in: this._statusArray } });
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
                        if (_order.status === 'ORDER_STATUS.SELECTING') {
                            _order.items.forEach(item => {
                                if (item.is_reward) {
                                    let _lConsumerDetail: UserDetail = UserDetails.findOne({ user_id: _order.creation_user });
                                    let _lPoints: UserRewardPoints = _lConsumerDetail.reward_points.filter(p => p.establishment_id === _order.establishment_id)[0];
                                    let _lNewPoints: number = Number.parseInt(_lPoints.points.toString()) + Number.parseInt(item.redeemed_points.toString());

                                    UserDetails.update({ _id: _lConsumerDetail._id }, { $pull: { reward_points: { establishment_id: _order.establishment_id } } });
                                    UserDetails.update({ _id: _lConsumerDetail._id }, { $push: { reward_points: { index: _lPoints.index, establishment_id: _order.establishment_id, points: _lNewPoints } } });

                                    let _lRedeemedPoints: number = item.redeemed_points;
                                    let _lValidatePoints: boolean = true;
                                    RewardPoints.collection.find({ id_user: Meteor.userId(), establishment_id: _order.establishment_id }, { sort: { gain_date: -1 } }).fetch().forEach((pnt) => {
                                        if (_lValidatePoints) {
                                            if (pnt.difference !== null && pnt.difference !== undefined && pnt.difference !== 0) {
                                                let aux: number = pnt.points - pnt.difference;
                                                _lRedeemedPoints = _lRedeemedPoints - aux;
                                                RewardPoints.update({ _id: pnt._id }, { $set: { difference: 0 } });
                                            } else if (!pnt.is_active) {
                                                _lRedeemedPoints = _lRedeemedPoints - pnt.points;
                                                RewardPoints.update({ _id: pnt._id }, { $set: { is_active: true } });
                                                if (_lRedeemedPoints === 0) {
                                                    _lValidatePoints = false;
                                                }
                                            }
                                        }
                                    });
                                }
                            });

                            Orders.update({ _id: _order._id }, {
                                $set: {
                                    status: 'ORDER_STATUS.CANCELED', modification_user: Meteor.userId(),
                                    modification_date: new Date()
                                }
                            });
                            const index = this._viewCtrl.index;
                            const index2 = this._viewCtrl.index - 1;
                            this._navCtrl.remove(index);
                            this._navCtrl.remove(index2);

                            this._toastMsg = this.itemNameTraduction('MOBILE.ORDERS.ORDER_CANCELED_MSG');
                            let toast = this.toastCtrl.create({
                                message: this._toastMsg,
                                duration: 1500,
                                position: 'middle'
                            });
                            toast.onDidDismiss(() => {
                            });
                            toast.present();
                        } else {
                            alert(alert_not);
                        }
                    }
                }
            ]
        });
        alertCancel.present();
    }

    presentToast() {
        this._toastMsg = this.itemNameTraduction('MOBILE.ORDERS.ORDER_CONFIRMED_MSG');
        let toast = this.toastCtrl.create({
            message: this._toastMsg,
            duration: 1500,
            position: 'middle'
        });

        toast.onDidDismiss(() => {
        });

        toast.present();
    }

    /**
     * Traduction
     * @param {string} itemName 
     */
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