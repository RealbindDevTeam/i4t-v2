import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AlertController, LoadingController, NavController, NavParams, ToastController, Platform } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Subject } from 'rxjs';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { Tables } from 'i4t_web/both/collections/establishment/table.collection';
import { Establishments } from 'i4t_web/both/collections/establishment/establishment.collection';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { WaiterCallDetails } from 'i4t_web/both/collections/establishment/waiter-call-detail.collection';
import { HomePage } from '../../home/home';
import { Network } from '@ionic-native/network';

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
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishment: any;
    private _table: any;
    private _orders: any;

    private disconnectSubscription: Subscription;

    constructor(public _navCtrl: NavController,
        public _navParams: NavParams,
        public _alertCtrl: AlertController,
        public _loadingCtrl: LoadingController,
        private _toastCtrl: ToastController,
        private _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone,
        public _platform: Platform,
        private _network: Network) {
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
            this._establishmentSub = MeteorObservable.subscribe('getEstablishmentByCurrentUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
                this._ngZone.run(() => {
                    this._tablesSub = MeteorObservable.subscribe('getTableById', this._table_code).takeUntil(this.ngUnsubscribe).subscribe();
                    this._establishment = Establishments.findOne({ _id: this._res_code });
                    this._table = Tables.findOne({ _id: this._table_code });
                });
            });

            this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe();

            this._ordersSub = MeteorObservable.subscribe('getOrdersByUserId', Meteor.userId(), ['ORDER_STATUS.SELECTING', 'ORDER_STATUS.CONFIRMED']).takeUntil(this.ngUnsubscribe).subscribe(() => {
                this._ngZone.run(() => {
                    this._orders = Orders.find({}).zone();
                });
            });
            this._waiterCallDetSub = MeteorObservable.subscribe('countWaiterCallDetailByUsrId', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe();
        }
    }

    /**
     * Allow user exit from establishment
     */
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
                            this.executeEstablishmentExit().then((result) => {
                                if (result) {
                                    let _lMessage: string = this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.LEAVE_RESTAURANT_MSG');
                                    let toast = this._toastCtrl.create({
                                        message: _lMessage,
                                        duration: 1500,
                                        position: 'middle'
                                    });
                                    toast.onDidDismiss(() => { });
                                    toast.present();
                                    this._navCtrl.setRoot(HomePage);
                                } else {
                                    let _lErrorMessage: string = this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ERROR_LEAVE_RESTAURANT');
                                    let toast = this._toastCtrl.create({
                                        message: _lErrorMessage,
                                        duration: 1500,
                                        position: 'middle'
                                    });
                                    toast.onDidDismiss(() => { });
                                    toast.present();
                                }
                            }).catch((err) => {
                                let _lErrorMessage: string = this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ERROR_LEAVE_RESTAURANT');
                                let toast = this._toastCtrl.create({
                                    message: _lErrorMessage,
                                    duration: 1500,
                                    position: 'middle'
                                });
                                toast.onDidDismiss(() => { });
                                toast.present();
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
                            this.executeEstablishmentExitWithSelectedOrders().then((result) => {
                                if (result) {
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
                                } else {
                                    let _lErrorMessage: string = this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ERROR_LEAVE_RESTAURANT');
                                    let toast = this._toastCtrl.create({
                                        message: _lErrorMessage,
                                        duration: 1500,
                                        position: 'middle'
                                    });
                                    toast.onDidDismiss(() => { });
                                    toast.present();
                                }
                            }).catch((err) => {
                                let _lErrorMessage: string = this.itemNameTraduction('MOBILE.RESTAURANT_EXIT.ERROR_LEAVE_RESTAURANT');
                                let toast = this._toastCtrl.create({
                                    message: _lErrorMessage,
                                    duration: 1500,
                                    position: 'middle'
                                });
                                toast.onDidDismiss(() => { });
                                toast.present();
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

    /**
     * Promise to validate user exit
     */
    executeEstablishmentExit(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                MeteorObservable.call('establishmentExit', Meteor.userId(), this._res_code, this._table_code).subscribe((result) => {
                    resolve(true);
                }, (error) => {
                    if (error.error === '300') {
                        resolve(false);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Promise to validate user exit with orders in selecting status
     */
    executeEstablishmentExitWithSelectedOrders(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                MeteorObservable.call('establishmentExitWithSelectedOrders', Meteor.userId(), this._res_code, this._table_code).subscribe((result) => {
                    resolve(true);
                }, (error) => {
                    if (error.error === '300') {
                        resolve(false);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
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
        this.removeSubscriptions();
        this.disconnectSubscription.unsubscribe();
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

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}


