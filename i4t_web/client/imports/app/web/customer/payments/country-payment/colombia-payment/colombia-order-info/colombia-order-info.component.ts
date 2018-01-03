import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MeteorObservable } from "meteor-rxjs";
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialogRef, MatDialog } from '@angular/material';
import { UserLanguageService } from '../../../../../services/general/user-language.service';
import { Orders } from '../../../../../../../../../both/collections/restaurant/order.collection';
import { Order, OrderTranslateInfo } from '../../../../../../../../../both/models/restaurant/order.model';
import { UserDetails } from '../../../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../../../both/models/auth/user-detail.model';
import { Table } from '../../../../../../../../../both/models/restaurant/table.model';
import { Tables } from '../../../../../../../../../both/collections/restaurant/table.collection';
import { Restaurant, RestaurantLegality } from '../../../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants, RestaurantsLegality } from '../../../../../../../../../both/collections/restaurant/restaurant.collection';
import { Currency } from '../../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../../both/collections/general/currency.collection';
import { Users } from '../../../../../../../../../both/collections/auth/user.collection';
import { User } from '../../../../../../../../../both/models/auth/user.model';
import { Items } from '../../../../../../../../../both/collections/menu/item.collection';
import { Item } from '../../../../../../../../../both/models/menu/item.model';
import { GarnishFood } from '../../../../../../../../../both/models/menu/garnish-food.model';
import { GarnishFoodCol } from '../../../../../../../../../both/collections/menu/garnish-food.collection';
import { Addition } from '../../../../../../../../../both/models/menu/addition.model';
import { Additions } from '../../../../../../../../../both/collections/menu/addition.collection';
import { AlertConfirmComponent } from '../../../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'colombia-order-info',
    templateUrl: './colombia-order-info.component.html',
    styleUrls: ['./colombia-order-info.component.scss']
})
export class ColombiaOrderInfoComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _ordersSub: Subscription;
    private _userDetailsSub: Subscription;
    private _restaurantSub: Subscription;
    private _currencySub: Subscription;
    private _tableSub: Subscription;
    private _usersSub: Subscription;
    private _itemsSub: Subscription;
    private _garnishFoodSub: Subscription;
    private _additionSub: Subscription;
    private _restaurantLegSub: Subscription;

    private _orders: Observable<Order[]>;
    private _items: Observable<Item[]>;
    private _garnishFood: Observable<GarnishFood[]>;
    private _additions: Observable<Addition[]>;

    private _restaurantId: string;
    private _tableId: string;
    private _currencyId: string;
    private _currencyCode: string;
    private _showOrdersInfo: boolean = false;
    private _showOrderDetails: boolean = false;

    private _totalValue: number = 0;
    private _ipoComBaseValue: number = 0;
    private _ipoComValue: number = 0;
    private _ipoCom: number = 108;
    private _ipoComBaseString: string;
    private _ipoComString: string;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _mdDialogRef: MatDialogRef<any>;
    private _restaurantLegality: RestaurantLegality;
    private _showRegimeCoData: boolean = false;
    private _showRegimeSiData: boolean = false;

    /**
     * ColombiaOrderInfoComponent Constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {Router} _router
     * @param {MatDialog} _dialog
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        private _router: Router,
        public _dialog: MatDialog,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
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
                            this._restaurantLegSub = MeteorObservable.subscribe('getRestaurantLegality', this._restaurantId).subscribe(() => {
                                this._ngZone.run(() => {
                                    this._restaurantLegality = RestaurantsLegality.findOne({ restaurant_id: this._restaurantId });
                                });
                            });
                            this._tableSub = MeteorObservable.subscribe('getTableByCurrentTable', this._user).subscribe(() => {
                                this._ngZone.run(() => {
                                    let _lTable: Table = Tables.findOne({ _id: _lUserDetail.current_table });
                                    this._tableId = _lTable._id;
                                    this._ordersSub = MeteorObservable.subscribe('getOrdersByUserId', this._user, ['ORDER_STATUS.DELIVERED', 'ORDER_STATUS.PENDING_CONFIRM']).subscribe(() => {
                                        this._ngZone.run(() => {
                                            this._orders = Orders.find({ creation_user: this._user, restaurantId: this._restaurantId, tableId: this._tableId, status: { $in: ['ORDER_STATUS.DELIVERED', 'ORDER_STATUS.PENDING_CONFIRM'] }, toPay: false }).zone();
                                            this._orders.subscribe(() => { this.calculateValues(); });
                                        });
                                    });
                                    this._usersSub = MeteorObservable.subscribe('getUserByTableId', this._restaurantId, this._tableId).subscribe();
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
                                    this._additionSub = MeteorObservable.subscribe('additionsByRestaurant', this._restaurantId).subscribe(() => {
                                        this._ngZone.run(() => {
                                            this._additions = Additions.find({}).zone();
                                        });
                                    });
                                });
                            });
                        });
                    });
                    this._showOrdersInfo = true;
                } else {
                    this._showOrdersInfo = false;
                }
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._userDetailsSub) { this._userDetailsSub.unsubscribe(); }
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._restaurantSub) { this._restaurantSub.unsubscribe(); }
        if (this._currencySub) { this._currencySub.unsubscribe(); }
        if (this._tableSub) { this._tableSub.unsubscribe(); }
        if (this._usersSub) { this._usersSub.unsubscribe(); }
        if (this._itemsSub) { this._itemsSub.unsubscribe(); }
        if (this._garnishFoodSub) { this._garnishFoodSub.unsubscribe(); }
        if (this._additionSub) { this._additionSub.unsubscribe(); }
        if (this._restaurantLegSub) { this._restaurantLegSub.unsubscribe(); }
    }

    /**
     * Function to calculate this values corresponding to Payment
     */
    calculateValues(): void {
        this._totalValue = 0;
        let _orderItemsCount = 0;
        let _orderAdditionsCount = 0;
        Orders.collection.find({ creation_user: this._user, restaurantId: this._restaurantId, tableId: this._tableId, status: { $in: ['ORDER_STATUS.DELIVERED', 'ORDER_STATUS.PENDING_CONFIRM'] }, toPay: false }).fetch().forEach((order) => {
            this._totalValue += order.totalPayment;
            _orderItemsCount += order.items.length;
            _orderAdditionsCount += order.additions.length;
        });
        if (this._restaurantLegality.regime === 'regime_co') {
            this._showRegimeCoData = true;
            this._showRegimeSiData = false;
            this._ipoComBaseValue = (this._totalValue * 100) / this._ipoCom;
            this._ipoComBaseString = (this._ipoComBaseValue).toFixed(2);
            this._ipoComValue = this._totalValue - this._ipoComBaseValue;
            this._ipoComString = (this._ipoComValue).toFixed(2);
        } else if (this._restaurantLegality.regime === 'regime_si') {
            this._showRegimeSiData = true;
            this._showRegimeCoData = false;
        }
        _orderItemsCount > 0 || _orderAdditionsCount > 0 ? this._showOrderDetails = true : this._showOrderDetails = false;
    }

    /**
     * Function to evaluate if the order is available to return to the first owner
     * @param {Order} _pOrder
     */
    isAvailableToReturn(_pOrder: Order): boolean {
        if (_pOrder.translateInfo.firstOrderOwner !== '' && _pOrder.translateInfo.lastOrderOwner !== ''
            && _pOrder.translateInfo.confirmedToTranslate && _pOrder.translateInfo.markedToTranslate
            && _pOrder.status === 'ORDER_STATUS.DELIVERED' && _pOrder.toPay === false) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * When this user want return the order, this function allow return the order with the original owner
     * @param {Order} _pOrder 
     */
    returnOrderToFirstOwner(_pOrder: Order): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        let _lMessage: string = this.itemNameTraduction('PAYMENTS.COLOMBIA.RETURN_ORDER_USER');
        this._mdDialogRef = this._dialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: this.itemNameTraduction('PAYMENTS.COLOMBIA.RETURN_ORDER_DLG'),
                subtitle: '',
                content: _lMessage + this.getUserName(_pOrder.translateInfo.firstOrderOwner) + ' ?',
                buttonCancel: this.itemNameTraduction('NO'),
                buttonAccept: this.itemNameTraduction('YES'),
                showCancel: true
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                let _lOrderTranslateInfo: OrderTranslateInfo = {
                    firstOrderOwner: _pOrder.translateInfo.firstOrderOwner, confirmedToTranslate: false,
                    lastOrderOwner: '', markedToTranslate: false
                };
                Orders.update({ _id: _pOrder._id }, {
                    $set: {
                        creation_user: _pOrder.translateInfo.firstOrderOwner,
                        modification_user: this._user,
                        translateInfo: _lOrderTranslateInfo
                    }
                }
                );
            }
        });
    }

    /**
     * Return User Name
     * @param {string} _pUserId 
     */
    getUserName(_pUserId: string): string {
        let _user: User = Users.collection.find({}).fetch().filter(u => u._id === _pUserId)[0];
        if (_user) {
            if (_user.username) {
                return _user.username;
            }
            else if (_user.profile.name) {
                return _user.profile.name;
            }
        }
    }

    /**
     * Return traduction
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
     * This function allow go to Orders
     */
    goToOrders() {
        this._router.navigate(['/app/orders']);
    }

    /**
    * This function open de error dialog according to parameters 
    * @param {string} title
    * @param {string} subtitle
    * @param {string} content
    * @param {string} btnCancelLbl
    * @param {string} btnAcceptLbl
    * @param {boolean} showBtnCancel
    */
    openDialog(title: string, subtitle: string, content: string, btnCancelLbl: string, btnAcceptLbl: string, showBtnCancel: boolean) {

        this._mdDialogRef = this._dialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: title,
                subtitle: subtitle,
                content: content,
                buttonCancel: btnCancelLbl,
                buttonAccept: btnAcceptLbl,
                showBtnCancel: showBtnCancel
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {

            }
        });
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}