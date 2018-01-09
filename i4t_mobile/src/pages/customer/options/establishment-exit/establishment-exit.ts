import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AlertController, LoadingController, NavController, NavParams, ToastController } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { Tables } from 'i4t_web/both/collections/establishment/table.collection';
import { Establishments } from 'i4t_web/both/collections/establishment/establishment.collection';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { Payments } from 'i4t_web/both/collections/establishment/payment.collection';
import { WaiterCallDetails } from 'i4t_web/both/collections/establishment/waiter-call-detail.collection';
import { Accounts } from 'i4t_web/both/collections/establishment/account.collection';
import { TabsPage } from '../../tabs/tabs';

@Component({
    selector: 'establishment-exit',
    templateUrl: 'establishment-exit.html'
})

export class EstablishmentExitPage implements OnInit, OnDestroy {

    private _res_code: string = '';
    private _table_code: string = '';

    private _establishmentSub: Subscription;
    private _tablesSub: Subscription;
    private _userDetailSub: Subscription;
    private _ordersSub: Subscription;
    private _waiterCallDetSub: Subscription;
    private _accountsSub: Subscription;

    private _establishment: any;
    private _table: any;
    private _orders: any;

    private _showWaiterCard: boolean = false;

    constructor(public _navCtrl: NavController,
        public _navParams: NavParams,
        public _alertCtrl: AlertController,
        public _loadingCtrl: LoadingController,
        private _toastCtrl: ToastController,
        private _translate: TranslateService,
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

        if (this._res_code !== '' && this._table_code !== '') {
            this._establishmentSub = MeteorObservable.subscribe('getEstablishmentByCurrentUser', Meteor.userId()).subscribe(() => {
                this._ngZone.run(() => {
                    this._tablesSub = MeteorObservable.subscribe('getTableById', this._table_code).subscribe();
                    this._establishment = Establishments.findOne({ _id: this._res_code });
                    this._table = Tables.findOne({ _id: this._table_code });
                });
            });

            this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).subscribe();

            this._ordersSub = MeteorObservable.subscribe('getOrdersByUserId', Meteor.userId(), ['ORDER_STATUS.REGISTERED', 'ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED',
                'ORDER_STATUS.DELIVERED', 'ORDER_STATUS.PENDING_CONFIRM']).subscribe(() => {
                    this._ngZone.run(() => {
                        this._orders = Orders.find({}).zone();
                        this._orders.subscribe(() => { this.validateOrdersMarkedToCancel(); });
                    });
                });
            this._waiterCallDetSub = MeteorObservable.subscribe('countWaiterCallDetailByUsrId', Meteor.userId()).subscribe();
            this._accountsSub = MeteorObservable.subscribe( 'getAccountsByUserId', Meteor.userId() ).subscribe();
        }
    }

    exitEstablishment() {
        let userDetailId = UserDetails.findOne({ user_id: Meteor.userId() })._id;
        let _lUserAccount = Accounts.findOne( { establishment_id : this._res_code, tableId : this._table_code, status: 'OPEN' } );

        if( _lUserAccount ){

            let _lOrdersRegisteredStatus: number = Orders.collection.find({ creation_user: Meteor.userId(), establishment_id: this._res_code, tableId: this._table_code, accountId: _lUserAccount._id, status: 'ORDER_STATUS.REGISTERED' }).count();
            let _lOrdersInProcessStatus: number = Orders.collection.find({ creation_user: Meteor.userId(), establishment_id: this._res_code, tableId: this._table_code, accountId: _lUserAccount._id, status: 'ORDER_STATUS.IN_PROCESS' }).count();
            let _lOrdersPreparedStatus: number = Orders.collection.find({ creation_user: Meteor.userId(), establishment_id: this._res_code, tableId: this._table_code, accountId: _lUserAccount._id, status: 'ORDER_STATUS.PREPARED' }).count();
            let _lOrdersDeliveredStatus: number = Orders.collection.find({ creation_user: Meteor.userId(), establishment_id: this._res_code, tableId: this._table_code, accountId: _lUserAccount._id, status: 'ORDER_STATUS.DELIVERED', toPay: false }).count();
            let _lOrdersToConfirm: number = Orders.collection.find({ establishment_id: this._res_code, tableId: this._table_code, accountId: _lUserAccount._id, 'translateInfo.firstOrderOwner': Meteor.userId(), 'translateInfo.markedToTranslate': true, status: 'ORDER_STATUS.PENDING_CONFIRM', toPay: false }).count();
            let _lOrdersWithPendingConfirmation: number = Orders.collection.find({ establishment_id: this._res_code, tableId: this._table_code, accountId: _lUserAccount._id, 'translateInfo.lastOrderOwner': Meteor.userId(), 'translateInfo.markedToTranslate': true, status: 'ORDER_STATUS.PENDING_CONFIRM', toPay: false }).count();
            let _lUserWaiterCallsCount: number = WaiterCallDetails.collection.find({ establishment_id: this._res_code, table_id: this._table_code, type: 'CALL_OF_CUSTOMER', user_id: Meteor.userId(), status: { $in: ['waiting', 'completed'] } }).count();
            let _lUserPaymentsCount: number = Payments.collection.find({ creation_user: Meteor.userId(), establishment_id: this._res_code, tableId: this._table_code, accountId: _lUserAccount._id, status: 'PAYMENT.NO_PAID', received: false }).count();

            if (_lOrdersRegisteredStatus === 0 && _lOrdersInProcessStatus === 0 && _lOrdersPreparedStatus === 0
                && _lOrdersDeliveredStatus === 0 && _lOrdersToConfirm === 0 && _lOrdersWithPendingConfirmation === 0
                && _lUserWaiterCallsCount === 0 && _lUserPaymentsCount === 0) {

                let confirm = this._alertCtrl.create({
                    title: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.RESTAURANT_EXIT'),
                    message: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.RESTAURANT_EXIT_CONFIRM'),
                    buttons: [
                        {
                            text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.NO_CONFIRM'),
                            handler: () => {
                            }
                        }, {
                            text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.YES_CONFIRM'),
                            handler: () => {
                                MeteorObservable.call('establishmentExit', userDetailId, this._res_code, this._table_code).subscribe(() => {
                                    let _lMessage: string = this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.LEAVE_RESTAURANT_MSG');
                                    let toast = this._toastCtrl.create({
                                        message: _lMessage,
                                        duration: 1500,
                                        position: 'middle'
                                    });
                                    toast.onDidDismiss(() => {
                                    });
                                    toast.present();
                                    this._navCtrl.pop();
                                });
                            }
                        }
                    ]
                });
                confirm.present();
            } else {
                if (_lOrdersRegisteredStatus > 0 && _lOrdersInProcessStatus === 0 && _lOrdersPreparedStatus === 0
                    && _lOrdersDeliveredStatus === 0 && _lOrdersToConfirm === 0 && _lOrdersWithPendingConfirmation === 0
                    && _lUserWaiterCallsCount === 0 && _lUserPaymentsCount === 0) {

                    let confirm = this._alertCtrl.create({
                        title: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ORDERS_REGISTERED'),
                        message: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ORDERS_CANCEL_CONFIRM'),
                        buttons: [
                            {
                                text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.NO_CONFIRM'),
                                handler: () => {
                                }
                            }, {
                                text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.YES_CONFIRM'),
                                handler: () => {
                                    MeteorObservable.call('establishmentExitWithRegisteredOrders', Meteor.userId(), userDetailId, this._res_code, this._table_code).subscribe(() => {
                                        let _lMessage: string = this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.LEAVE_RESTAURANT_MSG');
                                        let toast = this._toastCtrl.create({
                                            message: _lMessage,
                                            duration: 1500,
                                            position: 'middle'
                                        });
                                        toast.onDidDismiss(() => {
                                        });
                                        toast.present();
                                        this._navCtrl.pop();
                                    });
                                }
                            }
                        ]
                    });
                    confirm.present();
                } else {
                    if ((_lOrdersToConfirm > 0 || _lOrdersWithPendingConfirmation > 0) && _lOrdersRegisteredStatus === 0 && _lOrdersInProcessStatus === 0
                        && _lOrdersPreparedStatus === 0 && _lOrdersDeliveredStatus === 0 && _lUserWaiterCallsCount === 0
                        && _lUserPaymentsCount === 0) {

                        let confirm = this._alertCtrl.create({
                            title: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ORDERS_PENDING_CONFIRM'),
                            message: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ORDERS_MUST_BE_ATTENDED'),
                            buttons: [
                                {
                                    text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ACCEPT'),
                                }
                            ]
                        });
                        confirm.present();
                    } else {
                        if (_lUserWaiterCallsCount > 0 && _lOrdersRegisteredStatus === 0 && _lOrdersInProcessStatus === 0
                            && _lOrdersPreparedStatus === 0 && _lOrdersDeliveredStatus === 0 && _lOrdersToConfirm === 0
                            && _lOrdersWithPendingConfirmation === 0 && _lUserPaymentsCount === 0) {

                            let confirm = this._alertCtrl.create({
                                title: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.PENDING_WAITER_CALL'),
                                message: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.WAITER_CALLS_MSG'),
                                buttons: [
                                    {
                                        text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ACCEPT'),
                                    }
                                ]
                            });
                            confirm.present();
                        } else {
                            if (_lUserPaymentsCount > 0 && _lOrdersRegisteredStatus === 0 && _lOrdersInProcessStatus === 0
                                && _lOrdersPreparedStatus === 0 && _lOrdersDeliveredStatus === 0 && _lOrdersToConfirm === 0
                                && _lOrdersWithPendingConfirmation === 0 && _lUserWaiterCallsCount === 0) {

                                let confirm = this._alertCtrl.create({
                                    title: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.PENDING_PAYMENTS'),
                                    message: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.PENDING_PAYMENTS_MSG'),
                                    buttons: [
                                        {
                                            text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ACCEPT'),
                                        }
                                    ]
                                });
                                confirm.present();
                            } else {
                                if (_lOrdersDeliveredStatus > 0 && _lOrdersRegisteredStatus === 0 && _lOrdersInProcessStatus === 0
                                    && _lOrdersPreparedStatus === 0 && _lOrdersToConfirm === 0 && _lOrdersWithPendingConfirmation === 0
                                    && _lUserWaiterCallsCount === 0 && _lUserPaymentsCount === 0) {

                                    let confirm = this._alertCtrl.create({
                                        title: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ORDERS_DELIVERED'),
                                        message: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ORDERS_DELIVERED_MSG'),
                                        buttons: [
                                            {
                                                text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ACCEPT'),
                                            }
                                        ]
                                    });
                                    confirm.present();
                                } else {
                                    let confirm = this._alertCtrl.create({
                                        title: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.INVALID_OPERATION'),
                                        message: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.CALL_WAITER_MSG'),
                                        buttons: [
                                            {
                                                text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.NO_CONFIRM'),
                                                handler: () => {
                                                }
                                            }, {
                                                text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.YES_CONFIRM'),
                                                handler: () => {
                                                    MeteorObservable.call('establishmentExitWithOrdersInInvalidStatus', Meteor.userId(), this._res_code, this._table_code).subscribe(() => {

                                                        let confirm2 = this._alertCtrl.create({
                                                            title: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.WAITER_ON_THE_WAY'),
                                                            message: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.WAITER_ON_THE_WAY_CALL'),
                                                            buttons: [
                                                                {
                                                                    text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ACCEPT'),
                                                                }
                                                            ]
                                                        });
                                                        confirm2.present();
                                                    });
                                                }
                                            }
                                        ]
                                    });
                                    confirm.present();
                                }
                            }
                        }
                    }
                }
            }
        } else {
            let confirm = this._alertCtrl.create({
                title: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.RESTAURANT_EXIT'),
                message: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.GENERAL_ERROR'),
                buttons: [
                    {
                        text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ACCEPT'),
                    }
                ]
            });
            confirm.present();
        }
    }

    cancelWaiterCall() {
        Orders.find({
            creation_user: Meteor.userId(), establishment_id: this._res_code, tableId: this._table_code, markedToCancel: true,
            status: { $in: ['ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED'] }
        }).fetch().forEach((order) => {
            Orders.update({ _id: order._id }, { $set: { markedToCancel: null, modification_date: new Date() } });
        });

        let loader = this._loadingCtrl.create({
            duration: 2000
        });
        loader.present();
        setTimeout(() => {
            let waiterCall = WaiterCallDetails.findOne({ user_id: Meteor.userId(), type: 'USER_EXIT_TABLE', establishment_id: this._res_code, table_id: this._table_code, status: { $in: ["waiting", "completed"] } });
            if (waiterCall) {
                MeteorObservable.call('cancelCallClient', waiterCall, Meteor.userId()).subscribe(() => {
                    let _lMessage: string = this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.CALLED_CANCELED');
                    let toast = this._toastCtrl.create({
                        message: _lMessage,
                        duration: 2500,
                        position: 'middle'
                    });
                });
            }
        }, 1500);
    }

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * Validate orders marked to cancel
     */
    validateOrdersMarkedToCancel(): void {
        let _lOrdersToCancelCount: number = Orders.collection.find({ creation_user: Meteor.userId(), status: { $in: ['ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED'] }, markedToCancel: true }).count();
        _lOrdersToCancelCount > 0 ? this._showWaiterCard = true : this._showWaiterCard = false;
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
    removeSubscriptions(): void {
        if (this._establishmentSub) { this._establishmentSub.unsubscribe(); }
        if (this._tablesSub) { this._tablesSub.unsubscribe(); }
        if (this._userDetailSub) { this._userDetailSub.unsubscribe(); }
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._waiterCallDetSub) { this._waiterCallDetSub.unsubscribe(); }
        if (this._accountsSub) { this._accountsSub.unsubscribe(); }
    }
}


