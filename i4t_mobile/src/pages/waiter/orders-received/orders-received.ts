import { Component, OnInit, OnDestroy, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Select, AlertController, Platform } from 'ionic-angular';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription, Subject } from "rxjs";
import { Order } from 'i4t_web/both/models/establishment/order.model';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { UserDetail } from 'i4t_web/both/models/auth/user-detail.model';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { User } from 'i4t_web/both/models/auth/user.model';
import { Users } from 'i4t_web/both/collections/auth/user.collection';
import { Table } from 'i4t_web/both/models/establishment/table.model';
import { Tables } from 'i4t_web/both/collections/establishment/table.collection';
import { Item } from 'i4t_web/both/models/menu/item.model';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { Addition } from 'i4t_web/both/models/menu/addition.model';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { GarnishFood } from 'i4t_web/both/models/menu/garnish-food.model';
import { GarnishFoodCol } from 'i4t_web/both/collections/menu/garnish-food.collection';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { subscriptionLogsToBeFn } from 'rxjs/testing/TestScheduler';
import { Network } from '@ionic-native/network';

@Component({
    selector: 'orders-received',
    templateUrl: 'orders-received.html'
})
export class OrdersReceivedPage implements OnInit, OnDestroy {

    @ViewChild('select1') select1: Select;

    private _user = Meteor.userId();
    private _orderSub: Subscription;
    private _userDetailSub: Subscription;
    private _usersSub: Subscription;
    private _tablesSub: Subscription;
    private _itemsSub: Subscription;
    private _additionsSub: Subscription;
    private _garnishFoodSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _orders: Observable<Order[]>;
    private _userDetail: UserDetail;
    private _orderIndex: number = -1;
    private _thereAreOrders: boolean = true;
    private selected: string;

    private disconnectSubscription: Subscription;

    /**
     * OrdersReceivedPage Constructor
     * @param {TranslateService} _translate 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {NgZone} _ngZone
     */
    constructor(public _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone,
        public _alertCtrl: AlertController,
        public _platform: Platform,
        private _network: Network) {
        _translate.setDefaultLang('en');
        this.selected = 'today';
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
                if (this._userDetail) {
                    this._orderSub = MeteorObservable.subscribe('getOrdersByEstablishmentWork', this._user, ['ORDER_STATUS.RECEIVED']).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._ngZone.run(() => {
                            this.doFilter(this.selected);
                        });
                    });
                    this._usersSub = MeteorObservable.subscribe('getUsersByEstablishmentId', this._userDetail.establishment_work).takeUntil(this.ngUnsubscribe).subscribe();
                    this._tablesSub = MeteorObservable.subscribe('getTablesByEstablishment', this._userDetail.establishment_work).takeUntil(this.ngUnsubscribe).subscribe();
                    this._itemsSub = MeteorObservable.subscribe('itemsByEstablishment', this._userDetail.establishment_work).takeUntil(this.ngUnsubscribe).subscribe();
                    this._additionsSub = MeteorObservable.subscribe('additionsByEstablishment', this._userDetail.establishment_work).takeUntil(this.ngUnsubscribe).subscribe();
                    this._garnishFoodSub = MeteorObservable.subscribe('garnishFoodByEstablishment', this._userDetail.establishment_work).takeUntil(this.ngUnsubscribe).subscribe();
                }
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * Return User Name
     * @param {string} _pUserId 
     */
    getUserName(_pUserId: string): string {
        let _msg: string = this.itemNameTraduction('MOBILE.NO_NAME');
        let _lUser: User = Users.findOne({ _id: _pUserId });
        if (_lUser) {
            if (_lUser.username) {
                return _lUser.username;
            } else {
                if (_lUser.services) {
                    if (_lUser.services.facebook) {
                        return _lUser.services.facebook.name;
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
     * Return table number
     * @param {string} _pTableId 
     */
    getTableNumber(_pTableId: string): string {
        let _lTable: Table = Tables.findOne({ _id: _pTableId });
        if (_lTable) {
            return _lTable._number + '';
        } else {
            '';
        }
    }

    /**
     * Return table QR Code
     * @param {string} _pTableId 
     */
    getTableQRCode(_pTableId: string): string {
        let _lTable: Table = Tables.findOne({ _id: _pTableId });
        if (_lTable) {
            return _lTable.QR_code;
        } else {
            '';
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
     * Show order detail
     * @param {number} _index
     */
    showDetail(_index: number) {
        if (this._orderIndex === _index) {
            this._orderIndex = -1;
        } else {
            this._orderIndex = _index;
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
     * Show filter
     */
    showFilter() {
        this.select1.open();
        setTimeout(() => {
        }, 150);
    }

    /**
     * Method that allow find Orders by day
     * @param _pFilter 
     */
    doFilter(_pFilter: string) {
        let initDate: Date;
        let endDate: Date;
        initDate = new Date();
        endDate = new Date();
        initDate.setSeconds(0);
        initDate.setHours(0);
        initDate.setMinutes(0);
        endDate.setSeconds(59);
        endDate.setHours(23);
        endDate.setMinutes(59);
        this._orders = null;
        if (_pFilter === "today") {
            let tomorrow: number = endDate.getDate() + 1;
            endDate.setDate(tomorrow);
        } else if (_pFilter === "yesterday") {
            let yesterday: number = initDate.getDate() - 1;
            initDate.setDate(yesterday);
            endDate.setDate(yesterday);
        }
        this._orders = Orders.find({
            establishment_id: this._userDetail.establishment_work, "creation_date": { $gt: initDate, $lt: endDate },
        }, { sort: { code: -1 } }).zone();
        this._orders.subscribe(() => {
            let _lOrders: number = Orders.collection.find({ establishment_id: this._userDetail.establishment_work, "creation_date": { $gt: initDate, $lt: endDate } }).count();
            _lOrders > 0 ? this._thereAreOrders = true : this._thereAreOrders = false;
        })
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}