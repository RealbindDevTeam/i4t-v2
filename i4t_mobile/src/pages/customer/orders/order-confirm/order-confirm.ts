import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { NavController, LoadingController, ToastController, AlertController, ViewController, Platform } from 'ionic-angular';
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
import { Currencies } from 'i4t_web/both/collections/general/currency.collection';
import { RewardPoints } from 'i4t_web/both/collections/establishment/reward-point.collection';
import { ItemEditPage } from '../../item-edit/item-edit';
import { AdditionEditPage } from '../../addition-edit/addition-edit';
import { SegmentsPage } from '../../segments/segments';
import { Option } from 'i4t_web/both/models/menu/option.model';
import { Options } from 'i4t_web/both/collections/menu/option.collection';
import { OptionValue } from 'i4t_web/both/models/menu/option-value.model';
import { OptionValues } from 'i4t_web/both/collections/menu/option-value.collection';
import { Network } from '@ionic-native/network';
import { EstablishmentPoint } from 'i4t_web/both/models/points/establishment-point.model';
import { EstablishmentPoints } from 'i4t_web/both/collections/points/establishment-points.collection';
import { NegativePoint } from 'i4t_web/both/models/points/negative-point.model';
import { NegativePoints } from 'i4t_web/both/collections/points/negative-points.collection';

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
    private _currencySub: Subscription;
    private _rewardPointsSub: Subscription;
    private _optionSub: Subscription;
    private _optionValuesSub: Subscription;
    private _establishmentPointsSub: Subscription;
    private _negativePointsSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _orders: Observable<Order[]>;
    private _options: Observable<Option[]>;

    private _userDetail: UserDetail;
    private _currencyCode: string = "";
    private _statusArray: string[] = ['ORDER_STATUS.SELECTING'];
    private _res_code: string = "";
    private _table_code: string = "";
    private _toastMsg: string = "";

    private disconnectSubscription: Subscription;

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
        private _viewCtrl: ViewController,
        public _platform: Platform,
        private _network: Network) {
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
                    let _optionIds: string[] = [];
                    this._optionSub = MeteorObservable.subscribe('optionsByEstablishment', [this._res_code]).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._ngZone.run(() => {
                            this._options = Options.find({ establishments: { $in: [this._res_code] }, is_active: true }).zone();
                            this._options.subscribe(() => {
                                Options.find({ establishments: { $in: [this._res_code] }, is_active: true }).fetch().forEach((opt) => {
                                    _optionIds.push(opt._id);
                                });
                                this._optionValuesSub = MeteorObservable.subscribe('getOptionValuesByOptionIds', _optionIds).takeUntil(this.ngUnsubscribe).subscribe();
                            });
                        });
                    });
                    this._establishmentPointsSub = MeteorObservable.subscribe('getEstablishmentPointsByIds',[this._res_code]).takeUntil(this.ngUnsubscribe).subscribe();
                    this._negativePointsSub = MeteorObservable.subscribe('getNegativePointsByEstablishmentId', this._res_code).takeUntil(this.ngUnsubscribe).subscribe();
                }
            });
        });
        this._itemsSub = MeteorObservable.subscribe('itemsByUser', this._user).takeUntil(this.ngUnsubscribe).subscribe();
        this._additionsSub = MeteorObservable.subscribe('additionsByCurrentEstablishment', this._user).takeUntil(this.ngUnsubscribe).subscribe();
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

                                    let _establishmentPoints: EstablishmentPoint = EstablishmentPoints.findOne({ establishment_id: _order.establishment_id });
                                    let _negativePoints: NegativePoint = NegativePoints.findOne({ establishment_id: _order.establishment_id, order_id: _order._id, user_id: _order.creation_user });

                                    if (_negativePoints) {
                                        NegativePoints.update({ _id: _negativePoints._id }, { $set: { was_cancelled: true } });
                                        let _newPoints: number = Number.parseInt(_establishmentPoints.current_points.toString()) + Number.parseInt(_negativePoints.redeemed_points.toString());
                                        if (_newPoints >= 0) {
                                            EstablishmentPoints.update({ _id: _establishmentPoints._id }, { $set: { current_points: _newPoints, negative_balance: false } });
                                        } else {
                                            EstablishmentPoints.update({ _id: _establishmentPoints._id }, { $set: { current_points: _newPoints, negative_balance: true } });
                                        }
                                    } else {
                                        let _pointsResult: number = Number.parseInt(_establishmentPoints.current_points.toString()) + Number.parseInt(item.redeemed_points.toString());
                                        EstablishmentPoints.update({ _id: _establishmentPoints._id }, { $set: { current_points: _pointsResult, negative_balance: false } });
                                    }
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
        let alert = this.alertCtrl.create({
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