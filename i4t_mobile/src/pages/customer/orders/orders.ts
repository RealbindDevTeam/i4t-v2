import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { App, NavController, NavParams, AlertController, LoadingController, ToastController, ModalController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Order, OrderAddition } from 'i4t_web/both/models/establishment/order.model';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { Establishment } from 'i4t_web/both/models/establishment/establishment.model';
import { Establishments } from 'i4t_web/both/collections/establishment/establishment.collection';
import { Tables } from 'i4t_web/both/collections/establishment/table.collection';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { Storage } from '@ionic/storage';
import { CodeTypeSelectPage } from '../code-type-select/code-type-select';
import { SectionsPage } from '../sections/sections';
import { ItemEditPage } from '../item-edit/item-edit';
import { AdditionEditPage } from '../addition-edit/addition-edit';
import { EstablishmentProfilePage } from '../establishment-profile/establishment-profile';
import { Currencies } from 'i4t_web/both/collections/general/currency.collection';
import { UserDetail, UserRewardPoints } from '../../../../../i4t_web/both/models/auth/user-detail.model';
import { Meteor } from 'meteor/meteor';
import { Reward } from 'i4t_web/both/models/establishment/reward.model';
import { Rewards } from 'i4t_web/both/collections/establishment/reward.collection';
import { RewardListComponent } from './reward-list';
import { RewardPoints } from 'i4t_web/both/collections/establishment/reward-point.collection';
import { EstablishmentExitPage } from '../options/establishment-exit/establishment-exit';
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
    selector: 'page-orders',
    templateUrl: 'orders.html'
})
export class OrdersPage implements OnInit, OnDestroy {

    private _userDetailSub: Subscription;
    private _establishmentSub: Subscription;
    private _tablesSub: Subscription;
    private _ordersSub: Subscription;
    private _additionsSub: Subscription;
    private _itemsSub: Subscription;
    private _currencySub: Subscription;
    private _rewardsSub: Subscription;
    private _rewardPointsSub: Subscription;
    private _usersSub: Subscription;
    private _otherUSerDetailSub: Subscription;
    private _optionSub: Subscription;
    private _optionValuesSub: Subscription;
    private _establishmentPointsSub: Subscription;
    private _negativePointsSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _userLang: string;
    private _table_code: string = "";
    private _res_code: string = "";
    private _statusArray: string[];
    private _currentUserId: string;
    private _orderCustomerIndex: number = 1;
    private _orderOthersIndex: number = -1;
    private selected: string = "";
    private _currencyCode: string = "";
    private _toastMsg: string;

    private _establishments: any;
    private _establishment: any;
    private _table: any;
    private _additions: any;
    private _userDetail;
    private _orders;
    private _items;
    private _userDetails: Observable<UserDetail[]>;
    private _rewards: Observable<Reward[]>;
    private _options: Observable<Option[]>;

    private _currentOrderUserId: string;
    private _btnOrderItem: boolean = true;

    private _thereIsUser: boolean = true;
    private _thereAreOrders: boolean = true;
    private _showReedemPoints: boolean = true;
    private _userRewardPoints: number = 0;

    private disconnectSubscription: Subscription;

    constructor(public _navCtrl: NavController,
        public _navParams: NavParams,
        public _app: App,
        public _translate: TranslateService,
        public alertCtrl: AlertController,
        public _loadingCtrl: LoadingController,
        private _userLanguageService: UserLanguageServiceProvider,
        private toastCtrl: ToastController,
        public _modalCtrl: ModalController,
        private _ngZone: NgZone,
        public _platform: Platform,
        private _network: Network) {
        _translate.setDefaultLang('en');
        this._currentUserId = Meteor.userId();
        this._statusArray = ['ORDER_STATUS.SELECTING', 'ORDER_STATUS.CONFIRMED'];
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
        this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetails = UserDetails.find({ user_id: Meteor.userId() }).zone();
                this.validateUser();
                this._userDetails.subscribe(() => { this.validateUser() });
                this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
                if (this._userDetail) {
                    this._res_code = this._userDetail.current_establishment;
                    this.verifyUserRewardPoints();
                    this._userDetails.subscribe(() => { this.verifyUserRewardPoints() });
                    this._establishmentSub = MeteorObservable.subscribe('getEstablishmentByCurrentUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._ngZone.run(() => {
                            this._establishments = Establishments.find({ _id: this._userDetail.current_establishment }).zone();
                        });
                    });

                    this._tablesSub = MeteorObservable.subscribe('getTableById', this._userDetail.current_table).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._ngZone.run(() => {
                            this._table = Tables.findOne({ _id: this._userDetail.current_table });
                        });
                    });

                    this._ordersSub = MeteorObservable.subscribe('getOrdersByUserId', Meteor.userId(), this._statusArray).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._ngZone.run(() => {
                            this.getOrders();
                            this._orders = Orders.find({ establishment_id: this._userDetail.current_establishment, tableId: this._userDetail.current_table, status: { $in: this._statusArray } });
                            this._orders.subscribe(() => { this.getOrders() });
                        });
                    });

                    this._rewardsSub = MeteorObservable.subscribe('getEstablishmentRewards', this._userDetail.current_establishment).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._ngZone.run(() => {
                            this._rewards = Rewards.find({ establishments: { $in: [this._userDetail.current_establishment] } }).zone();
                            this.countRewards();
                            this._rewards.subscribe(() => { this.countRewards(); });
                        });
                    });

                    this._rewardPointsSub = MeteorObservable.subscribe('getRewardPointsByUserId', this._currentUserId).takeUntil(this.ngUnsubscribe).subscribe();
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

                this._usersSub = MeteorObservable.subscribe('getUserByTableId', this._userDetail.current_establishment, this._userDetail.current_table).takeUntil(this.ngUnsubscribe).subscribe();
                this._otherUSerDetailSub = MeteorObservable.subscribe('getUserDetailsByCurrentTable', this._userDetail.current_establishment, this._userDetail.current_table).takeUntil(this.ngUnsubscribe).subscribe();
            });
        });

        this._itemsSub = MeteorObservable.subscribe('itemsByUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe();
        this._additionsSub = MeteorObservable.subscribe('additionsByCurrentEstablishment', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe();
        this._currencySub = MeteorObservable.subscribe('getCurrenciesByCurrentUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                if (Currencies.find({}).fetch().length > 0) {
                    this._currencyCode = Currencies.find({}).fetch()[0].code;
                }
            });
        });
    }

    validateUser(): void {
        let _user: UserDetail = UserDetails.findOne({ user_id: Meteor.userId() });
        if (_user) {
            if (_user.current_establishment !== '' && _user.current_table !== '') {
                this._thereIsUser = true;
            } else {
                this._thereIsUser = false;
            }
        } else {
            this._thereIsUser = false
        }
    }

    /**
     * Verify user reward points
     */
    verifyUserRewardPoints(): void {
        let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: Meteor.userId() });
        if (_lUserDetail) {
            let _lRewardPoints: UserRewardPoints[] = _lUserDetail.reward_points;

            if (_lRewardPoints) {
                if (_lRewardPoints.length > 0) {
                    let _lPoints: UserRewardPoints = _lUserDetail.reward_points.filter(p => p.establishment_id === this._res_code)[0];
                    if (_lPoints) {
                        this._userRewardPoints = _lPoints.points;
                    } else {
                        this._userRewardPoints = 0;
                    }
                } else {
                    this._userRewardPoints = 0;
                }
            }
        }
    }

    getOrders() {
        Orders.collection.find({ establishment_id: this._userDetail.current_establishment, tableId: this._userDetail.current_table, status: { $in: this._statusArray } }).count() > 0 ? this._thereAreOrders = true : this._thereAreOrders = false;
    }

    countRewards(): void {
        Rewards.collection.find({ establishments: { $in: [this._userDetail.current_establishment] } }).count() > 0 ? this._showReedemPoints = true : this._showReedemPoints = false;
    }

    goToNewOrder() {
        let dialogMsg = this.itemNameTraduction('MOBILE.ORDERS.LOADING_MENU');

        this._userDetail = UserDetails.collection.findOne({ user_id: Meteor.userId() });

        if (this._userDetail.current_table == "") {
            this._navCtrl.push(CodeTypeSelectPage);
        } else {
            MeteorObservable.call('getCurrentEstablishmentByUser', this._userDetail.current_establishment).subscribe((establishment: Establishment) => {
                if (establishment == null) {
                    this._navCtrl.push(CodeTypeSelectPage);

                } else {
                    let loading = this._loadingCtrl.create({
                        content: dialogMsg
                    });

                    loading.present();
                    setTimeout(() => {
                        this._navCtrl.push(SectionsPage, { res_id: establishment._id, table_id: this._userDetail.current_table });
                        loading.dismiss();
                    }, 1500);
                }
            }, (error) => {
                alert(`Failed to get table ${error}`);
            });
        }
    }

    showDetail(i) {
        if (this._orderCustomerIndex == i) {
            this._orderCustomerIndex = -1;
        } else {
            this._orderCustomerIndex = i;
        }
        this._orderOthersIndex = -1;
    }

    showOrderDetail(i) {
        if (this._orderOthersIndex == i) {
            this._orderOthersIndex = -1;
        } else {
            this._orderOthersIndex = i;
        }
        this._orderCustomerIndex = -1;
    }

    ionViewDidLoad() {
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
                        if (_order.status === 'ORDER_STATUS.SELECTING') {
                            //for reward item
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
                            this._orderCustomerIndex = -1;

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

    confirmOrder(_order) {
        let dialog_title = this.itemNameTraduction('MOBILE.ORDERS.CONFIRM_ORDER');
        let dialog_subtitle = this.itemNameTraduction('MOBILE.ORDERS.SURE_CONFIRM');
        let dialog_cancel_btn = this.itemNameTraduction('MOBILE.ORDERS.NO_ANSWER');
        let dialog_accept_btn = this.itemNameTraduction('MOBILE.ORDERS.YES_ANSWER');
        let alert_not = this.itemNameTraduction('MOBILE.ORDERS.IMPOSSIBLE_CONFIRM');
        let item_not = this.itemNameTraduction('MOBILE.ORDERS.NOT_ITEM_AVAILABLE');
        let _loadingMsg = this.itemNameTraduction('MOBILE.ORDERS.ORDER_CONFIRM');

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
                                        loading.dismiss();
                                        this.presentToast();
                                    }, (error) => {
                                        alert(`Error: ${error}`);
                                    });
                                }, 1500);
                                this._orderCustomerIndex = -1;
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

    goToRewardList() {
        this._navCtrl.push(RewardListComponent, { establishment: this._res_code });
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
            return (_item.establishments.filter(r => r.establishment_id === this._res_code)[0]).isAvailable;
        }
    }

    getAdditionName(_additionId: string): string {
        let _additionName = Additions.findOne({ _id: _additionId }).name;
        if (_additionName) {
            return _additionName;
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
     * Go to establishment exit page
     */
    goToEstablishmentExit() {
        this._navCtrl.push(EstablishmentExitPage, { res_id: this._userDetail.current_establishment, table_id: this._userDetail.current_table });
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

    ionViewWillUnload() {
        this.removeSubscriptions();
    }

    ngOnDestroy() {
        this.removeSubscriptions();
    }

    /**
     * Go to establishment profile
     * @param _pEstablishment 
     */
    viewEstablishmentProfile(_pEstablishment: any) {
        this._navCtrl.push(EstablishmentProfilePage, { establishment: _pEstablishment });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}