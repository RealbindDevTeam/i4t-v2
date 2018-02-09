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
import { WaiterCallDetails } from 'i4t_web/both/collections/establishment/waiter-call-detail.collection';
import { HomePage } from '../../home/home';

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

    private _establishment: any;
    private _table: any;
    private _orders: any;

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

            this._ordersSub = MeteorObservable.subscribe('getOrdersByUserId', Meteor.userId(), ['ORDER_STATUS.SELECTING', 'ORDER_STATUS.CONFIRMED']).subscribe(() => {
                    this._ngZone.run(() => {
                        this._orders = Orders.find({}).zone();
                    });
                });
            this._waiterCallDetSub = MeteorObservable.subscribe('countWaiterCallDetailByUsrId', Meteor.userId()).subscribe();
        }
    }

    exitEstablishment() {
        let userDetailId = UserDetails.findOne({ user_id: Meteor.userId() })._id;

        let _lOrdersSelectingStatus: number = Orders.collection.find({
            creation_user: Meteor.userId(), establishment_id: this._res_code, tableId: this._table_code,
            status: 'ORDER_STATUS.SELECTING'
        }).count();

        let _lOrdersConfirmedStatus: number = Orders.collection.find({
            creation_user: Meteor.userId(), establishment_id: this._res_code, tableId: this._table_code,
            status: 'ORDER_STATUS.CONFIRMED'
        }).count();

        let _lUserWaiterCallsCount: number = WaiterCallDetails.collection.find({
            establishment_id: this._res_code, table_id: this._table_code,
            type: 'CALL_OF_CUSTOMER', user_id: Meteor.userId(), status: { $in: ['waiting', 'completed'] }
        }).count();

        if (_lOrdersSelectingStatus === 0 && _lOrdersConfirmedStatus === 0 && _lUserWaiterCallsCount === 0) {
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
                            MeteorObservable.call('establishmentExit', Meteor.userId(), this._res_code, this._table_code).subscribe(() => {
                                let _lMessage: string = this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.LEAVE_RESTAURANT_MSG');
                                let toast = this._toastCtrl.create({
                                    message: _lMessage,
                                    duration: 1500,
                                    position: 'middle'
                                });
                                toast.onDidDismiss(() => {
                                });
                                toast.present();
                                this._navCtrl.setRoot(HomePage);
                            });
                        }
                    }
                ]
            });
            confirm.present();
        } else if (_lOrdersSelectingStatus > 0 && _lOrdersConfirmedStatus === 0 && _lUserWaiterCallsCount === 0) {
            let confirm = this._alertCtrl.create({
                title: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ORDERS_SELECTED'),
                message: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ORDERS_CANCEL_CONFIRM'),
                buttons: [
                    {
                        text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.NO_CONFIRM'),
                        handler: () => {
                        }
                    }, {
                        text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.YES_CONFIRM'),
                        handler: () => {
                            MeteorObservable.call('establishmentExitWithSelectedOrders', Meteor.userId(), this._res_code, this._table_code).subscribe(() => {
                                let _lMessage: string = this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.LEAVE_RESTAURANT_MSG');
                                let toast = this._toastCtrl.create({
                                    message: _lMessage,
                                    duration: 1500,
                                    position: 'middle'
                                });
                                toast.onDidDismiss(() => {
                                });
                                toast.present();
                                this._navCtrl.setRoot(HomePage);
                            });
                        }
                    }
                ]
            });
            confirm.present();
        } else if (_lUserWaiterCallsCount > 0) {
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
        } else if (_lOrdersConfirmedStatus > 0) {
            let confirm = this._alertCtrl.create({
                title: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ORDERS_CONFIRMED'),
                message: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ORDERS_CONFIRMED_MSG'),
                buttons: [
                    {
                        text: this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ACCEPT'),
                    }
                ]
            });
            confirm.present();
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
    removeSubscriptions(): void {
        if (this._establishmentSub) { this._establishmentSub.unsubscribe(); }
        if (this._tablesSub) { this._tablesSub.unsubscribe(); }
        if (this._userDetailSub) { this._userDetailSub.unsubscribe(); }
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._waiterCallDetSub) { this._waiterCallDetSub.unsubscribe(); }
    }
}


