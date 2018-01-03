import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MeteorObservable } from "meteor-rxjs";
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { UserLanguageService } from '../../../../../services/general/user-language.service';
import { Payment } from '../../../../../../../../../both/models/restaurant/payment.model';
import { Payments } from '../../../../../../../../../both/collections/restaurant/payment.collection';
import { Orders } from '../../../../../../../../../both/collections/restaurant/order.collection';
import { Order } from '../../../../../../../../../both/models/restaurant/order.model';
import { UserDetails } from '../../../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../../../both/models/auth/user-detail.model';
import { Table } from '../../../../../../../../../both/models/restaurant/table.model';
import { Tables } from '../../../../../../../../../both/collections/restaurant/table.collection';
import { Restaurant } from '../../../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../../../../both/collections/restaurant/restaurant.collection';
import { Currency } from '../../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../../both/collections/general/currency.collection';
import { Users } from '../../../../../../../../../both/collections/auth/user.collection';
import { User } from '../../../../../../../../../both/models/auth/user.model';
import { PaymentMethod } from '../../../../../../../../../both/models/general/paymentMethod.model';
import { PaymentMethods } from '../../../../../../../../../both/collections/general/paymentMethod.collection';
import { Item } from '../../../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../../../both/collections/menu/item.collection';
import { GarnishFood } from '../../../../../../../../../both/models/menu/garnish-food.model';
import { GarnishFoodCol } from '../../../../../../../../../both/collections/menu/garnish-food.collection';
import { Addition } from '../../../../../../../../../both/models/menu/addition.model';
import { Additions } from '../../../../../../../../../both/collections/menu/addition.collection';

@Component({
    selector: 'colombia-pay-info',
    templateUrl: './colombia-pay-info.component.html',
    styleUrls: ['./colombia-pay-info.component.scss']
})
export class ColombiaPayInfoComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _paymentsSub: Subscription;
    private _userDetailsSub: Subscription;
    private _restaurantSub: Subscription;
    private _currencySub: Subscription;
    private _tableSub: Subscription;
    private _usersSub: Subscription;
    private _paymentMethodsSub: Subscription;
    private _ordersSub: Subscription;
    private _itemsSub: Subscription;
    private _garnishFoodSub: Subscription;
    private _additionsSub: Subscription;

    private _payments: Observable<Payment[]>;
    private _paymentMethods: Observable<PaymentMethod[]>;
    private _orders: Observable<Order[]>;
    private _items: Observable<Item[]>;
    private _garnishFood: Observable<GarnishFood[]>;
    private _additions: Observable<Addition[]>;

    private _showPaymentsInfo: boolean = false;
    private _restaurantId: string;
    private _tableId: string;
    private _currencyId: string;
    private _currencyCode: string;

    /**
     * ColombiaPayInfoComponent Constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {Router} _router
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        private _router: Router,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByUser', this._user).subscribe(() => {
            this._ngZone.run(() => {
                let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: this._user });
                if (_lUserDetail.current_restaurant !== "" && _lUserDetail.current_table !== "") {
                    this._restaurantSub = MeteorObservable.subscribe('getRestaurantByCurrentUser', this._user).subscribe(() => {
                        this._ngZone.run(() => {
                            let _lRestaurant: Restaurant = Restaurants.findOne({ _id: _lUserDetail.current_restaurant });
                            this._restaurantId = _lRestaurant._id;
                            this._currencyId = _lRestaurant.currencyId;
                            this._currencySub = MeteorObservable.subscribe('getCurrenciesByRestaurantsId', [this._restaurantId]).subscribe(() => {
                                this._ngZone.run(() => {
                                    let _lCurrency: Currency = Currencies.findOne({ _id: _lRestaurant.currencyId });
                                    this._currencyCode = _lCurrency.code;
                                });
                            });
                            this._tableSub = MeteorObservable.subscribe('getTableByCurrentTable', this._user).subscribe(() => {
                                this._ngZone.run(() => {
                                    let _lTable: Table = Tables.findOne({ _id: _lUserDetail.current_table });
                                    this._tableId = _lTable._id;
                                    this._paymentsSub = MeteorObservable.subscribe('getUserPaymentsByRestaurantAndTable', this._user, this._restaurantId, this._tableId, ['PAYMENT.NO_PAID', 'PAYMENT.PAID']).subscribe(() => {
                                        this._ngZone.run(() => {
                                            this._payments = Payments.find({}).zone();
                                        });
                                    });
                                    this._usersSub = MeteorObservable.subscribe('getUserByTableId', this._restaurantId, this._tableId).subscribe();
                                    this._ordersSub = MeteorObservable.subscribe('getOrdersByUserId', this._user, ['ORDER_STATUS.DELIVERED', 'ORDER_STATUS.CLOSED']).subscribe(() => {
                                        this._ngZone.run(() => {
                                            this._orders = Orders.find({ creation_user: this._user, restaurantId: this._restaurantId, tableId: this._tableId, status: { $in: ['ORDER_STATUS.DELIVERED', 'ORDER_STATUS.CLOSED'] } }).zone();
                                        });
                                    });
                                    this._itemsSub = MeteorObservable.subscribe('itemsByRestaurant', this._restaurantId).subscribe(() => {
                                        this._ngZone.run(() => {
                                            this._items = Items.find({}).zone();
                                        });
                                    });
                                    this._garnishFoodSub = MeteorObservable.subscribe('garnishFoodByRestaurant', this._restaurantId).subscribe(() => {
                                        this._ngZone.run(() => {
                                            this._garnishFood = GarnishFoodCol.find({}).zone();
                                        });
                                    });
                                    this._additionsSub = MeteorObservable.subscribe('additionsByRestaurant', this._restaurantId).subscribe(() => {
                                        this._ngZone.run(() => {
                                            this._additions = Additions.find({}).zone();
                                        });
                                    });
                                });
                            });
                        });
                    });
                    this._showPaymentsInfo = true;
                } else {
                    this._showPaymentsInfo = false;
                }
            });
        });
        this._paymentMethodsSub = MeteorObservable.subscribe('paymentMethods').subscribe(() => {
            this._ngZone.run(() => {
                this._paymentMethods = PaymentMethods.find({}).zone();
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._userDetailsSub) { this._userDetailsSub.unsubscribe(); }
        if (this._paymentsSub) { this._paymentsSub.unsubscribe(); }
        if (this._restaurantSub) { this._restaurantSub.unsubscribe(); }
        if (this._currencySub) { this._currencySub.unsubscribe(); }
        if (this._tableSub) { this._tableSub.unsubscribe(); }
        if (this._usersSub) { this._usersSub.unsubscribe(); }
        if (this._paymentMethodsSub) { this._paymentMethodsSub.unsubscribe(); }
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._itemsSub) { this._itemsSub.unsubscribe(); }
        if (this._garnishFoodSub) { this._garnishFoodSub.unsubscribe(); }
        if (this._additionsSub) { this._additionsSub.unsubscribe(); }
    }

    /**
     * Return unit price
     * @param {Item} _pItem 
     */
    getUnitPrice(_pItem: Item): number {
        return _pItem.prices.filter(p => p.currencyId === this._currencyId)[0].price;
    }

    /**
     * Return Total price
     * @param {Item} _pItem 
     */
    getTotalPrice(_pItem: Item, _pOrderItemQuantity: number): number {
        return _pItem.restaurants.filter(p => p.restaurantId === this._restaurantId)[0].price * _pOrderItemQuantity;
    }

    /**
     * Return Unit garnish food price
     * @param {GarnishFood} _pGarnishFood
     */
    getGarnisFoodUnitPrice(_pGarnishFood: GarnishFood): number {
        return _pGarnishFood.prices.filter(g => g.currencyId === this._currencyId)[0].price;
    }

    /**
     * Return Total Garnish Food Price
     */
    getGarnishFoodTotalPrice(_pGarnishFood: GarnishFood, _pOrderItemQuantity: number): number {
        return _pGarnishFood.restaurants.filter(g => g.restaurantId === this._restaurantId)[0].price * _pOrderItemQuantity;
    }

    /**
     * Return Unit addition price
     * @param {Addition} _pAddition 
     */
    getAdditionUnitPrice(_pAddition: Addition): number {
        return _pAddition.prices.filter(a => a.currencyId === this._currencyId)[0].price;
    }

    /**
     * Return Total addition Price
     * @param {Addition} _pAddition 
     */
    getAdditionTotalPrice(_pAddition: Addition, _pOrderItemQuantity: number): number {
        return _pAddition.restaurants.filter(a => a.restaurantId === this._restaurantId)[0].price * _pOrderItemQuantity;
    }

    /**
     * Return To Payments Component
     */
    returnToPaymentsComponent(): void {
        this._router.navigate(['app/payments']);
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}
