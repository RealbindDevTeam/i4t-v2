import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
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

@Component({
    selector: 'orders-received',
    templateUrl: 'orders-received.html'
})
export class OrdersReceivedPage implements OnInit, OnDestroy {

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

    /**
     * OrdersReceivedPage Constructor
     * @param {TranslateService} _translate 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {NgZone} _ngZone
     */
    constructor(public _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone) {
        _translate.setDefaultLang('en');
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
                            this._orders = Orders.find({ establishment_id: this._userDetail.establishment_work }, { sort: { code: -1 } }).zone();
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
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}