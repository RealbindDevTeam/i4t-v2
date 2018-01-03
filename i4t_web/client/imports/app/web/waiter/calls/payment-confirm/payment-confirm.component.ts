import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatSnackBar } from '@angular/material';
import { Observable, Subscription } from 'rxjs';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Payment } from '../../../../../../../both/models/restaurant/payment.model';
import { Payments } from '../../../../../../../both/collections/restaurant/payment.collection';
import { Order } from '../../../../../../../both/models/restaurant/order.model';
import { Orders } from '../../../../../../../both/collections/restaurant/order.collection';
import { Users } from '../../../../../../../both/collections/auth/user.collection';
import { User } from '../../../../../../../both/models/auth/user.model';
import { Currency } from '../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../both/collections/general/currency.collection';
import { Item } from '../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../both/collections/menu/item.collection';
import { PaymentMethod } from '../../../../../../../both/models/general/paymentMethod.model';
import { PaymentMethods } from '../../../../../../../both/collections/general/paymentMethod.collection';
import { Table } from '../../../../../../../both/models/restaurant/table.model';
import { Tables } from '../../../../../../../both/collections/restaurant/table.collection';
import { WaiterCallDetail } from '../../../../../../../both/models/restaurant/waiter-call-detail.model';
import { Additions } from '../../../../../../../both/collections/menu/addition.collection';
import { Addition } from '../../../../../../../both/models/menu/addition.model';
import { GarnishFood } from '../../../../../../../both/models/menu/garnish-food.model';
import { GarnishFoodCol } from '../../../../../../../both/collections/menu/garnish-food.collection';

@Component({
    selector: 'payment-confirm',
    templateUrl: './payment-confirm.component.html',
    styleUrls: ['./payment-confirm.component.scss'],
    providers: [UserLanguageService]
})
export class PaymentConfirmComponent implements OnInit, OnDestroy {

    public call: WaiterCallDetail;

    private _user = Meteor.userId();
    private _paymentsSub: Subscription;
    private _ordersSub: Subscription;
    private _usersSub: Subscription;
    private _currencySub: Subscription;
    private _itemsSub: Subscription;
    private _paymentMethodsSub: Subscription;
    private _tablesSub: Subscription;
    private _additionsSub: Subscription;
    private _garnishFoodSub: Subscription;

    private _payments: Observable<Payment[]>;
    private _orders: Observable<Order[]>;
    private _items: Observable<Item[]>;
    private _paymentMethods: Observable<PaymentMethod[]>;
    private _additions: Observable<Addition[]>;
    private _garnishFood: Observable<GarnishFood[]>;

    private _orderIndex: number = -1;
    private _paymentIndex: number = -1;
    private _totalPayment: number = 0;
    private _tableNumber: string;
    private _tableQRCode: string;
    private _payAllowed: boolean = false;
    private _loading: boolean = false;

    /**
     * PaymentConfirmComponent constructor
     * @param {TranslateService} translate
     * @param {MatDialogRef<any>} _dialogRef
     * @param {NgZone} _ngZone
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _translate: TranslateService,
        public _dialogRef: MatDialogRef<any>,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        private _snackBar: MatSnackBar) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._paymentsSub = MeteorObservable.subscribe('getPaymentsToWaiter', this.call.restaurant_id, this.call.table_id).subscribe(() => {
            this._ngZone.run(() => {
                this._payments = Payments.find({}).zone();
                this._payments.subscribe(() => { this.totalPayment(); this.verifyReceivedPayments(); });
            });
        });
        this._ordersSub = MeteorObservable.subscribe('getOrdersByTableId', this.call.restaurant_id, this.call.table_id, ['ORDER_STATUS.DELIVERED']).subscribe(() => {
            this._ngZone.run(() => {
                this._orders = Orders.find({}).zone();
            });
        });

        this._currencySub = MeteorObservable.subscribe('getCurrenciesByRestaurantsId', [this.call.restaurant_id]).subscribe();

        this._usersSub = MeteorObservable.subscribe('getUserByTableId', this.call.restaurant_id, this.call.table_id).subscribe();

        this._itemsSub = MeteorObservable.subscribe('itemsByRestaurant', this.call.restaurant_id).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
            });
        });

        this._paymentMethodsSub = MeteorObservable.subscribe('paymentMethods').subscribe(() => {
            this._ngZone.run(() => {
                this._paymentMethods = PaymentMethods.find({}).zone();
            });
        });

        this._tablesSub = MeteorObservable.subscribe('getTablesByRestaurant', this.call.restaurant_id).subscribe(() => {
            this._ngZone.run(() => {
                let _lTable: Table = Tables.collection.find({ _id: this.call.table_id }).fetch()[0];
                this._tableNumber = _lTable._number + '';
                this._tableQRCode = _lTable.QR_code;
            });
        });

        this._additionsSub = MeteorObservable.subscribe('additionsByRestaurantWork', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._additions = Additions.find({}).zone();
            });
        });

        this._garnishFoodSub = MeteorObservable.subscribe('garnishFoodByRestaurantWork', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._garnishFood = GarnishFoodCol.find({}).zone();
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._paymentsSub) { this._paymentsSub.unsubscribe(); }
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._usersSub) { this._usersSub.unsubscribe(); }
        if (this._currencySub) { this._currencySub.unsubscribe(); }
        if (this._itemsSub) { this._itemsSub.unsubscribe(); }
        if (this._paymentMethodsSub) { this._paymentMethodsSub.unsubscribe(); }
        if (this._tablesSub) { this._tablesSub.unsubscribe(); }
        if (this._additionsSub) { this._additionsSub.unsubscribe(); }
        if (this._garnishFoodSub) { this._garnishFoodSub.unsubscribe(); }
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
     * Return Payment Currency
     * @param {string} _pCurrencyId 
     */
    getPaymentCurrency(_pCurrencyId: string): string {
        let _lCurrency: Currency = Currencies.findOne({ _id: _pCurrencyId });
        if (_lCurrency) { return _lCurrency.code; }
    }

    /**
     * Allow User Show order Detail
     * @param {Order} _pOrder
     * @param {number} _pPaymentIndex 
     * @param {number} _pOrderIndex 
     */
    showOrderDetail(_pOrder: Order, _pPaymentIndex: number, _pOrderIndex: number): void {
        this._paymentIndex = _pPaymentIndex;

        if (this._orderIndex === _pOrderIndex) {
            this._orderIndex = -1;
        } else {
            this._orderIndex = _pOrderIndex;
        }
    }

    /**
     * Close PaymentConfirm Dialog
     */
    close(): void {
        this._dialogRef.close();
    }

    /**
     * Update payment received status
     * @param {Payment} _pPayment 
     */
    updateReceivedStatus(_pPayment: Payment): void {
        Payments.update(_pPayment._id,
            {
                $set: {
                    received: !_pPayment.received,
                    modification_date: new Date(),
                    modification_user: this._user
                }
            });
    }

    /**
     * Calculate total payment
     */
    totalPayment() {
        this._totalPayment = 0;
        Payments.collection.find({ restaurantId: this.call.restaurant_id, tableId: this.call.table_id }).fetch().forEach((pay) => {
            this._totalPayment += pay.totalToPayment;
        });
    }

    /**
     * Function to verify all table payments received status is recived
     */
    verifyReceivedPayments(): void {
        let _lPaymentsReceived = Payments.collection.find({ restaurantId: this.call.restaurant_id, tableId: this.call.table_id, status: 'PAYMENT.NO_PAID', received: true }).count();
        _lPaymentsReceived > 0 ? this._payAllowed = true : this._payAllowed = false;
    }

    /**
     * Function to close table payments
     */
    closePayments(): void {
        this._loading = true;
        setTimeout(() => {
            this.closePay().then((result) => {
                if (result) {
                    let _lPaymentsNoReceived = Payments.collection.find({ restaurantId: this.call.restaurant_id, tableId: this.call.table_id, status: 'PAYMENT.NO_PAID', received: false }).count();
                    this._loading = false;
                    if (_lPaymentsNoReceived === 0) {
                        this.close();
                    }
                } else {
                    this._loading = false;
                    let _lMessage: string = this.itemNameTraduction('PAYMENT_CONFIRM.ERROR');
                    this._snackBar.open(_lMessage, '', { duration: 3000 });
                    this.close();
                }
            }).catch((err) => {
                this._loading = false;
                let _lMessage: string = this.itemNameTraduction('PAYMENT_CONFIRM.ERROR');
                this._snackBar.open(_lMessage, '', { duration: 3000 });
                this.close();
            });
        }, 1500);
    }

    /**
     * Promise to close pay
     */
    closePay(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                MeteorObservable.call('closePay', this.call.restaurant_id, this.call.table_id, this.call).subscribe(() => {
                    resolve(true);
                }, (error) => {
                    resolve(false);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Update Payments with received true or false
     * @param {any} _event 
     */
    markPaymentsAsReceived(_event: any): void {
        if (_event.checked) {
            Payments.collection.find({}).fetch().forEach((pay) => {
                Payments.update(pay._id, { $set: { received: true, modification_user: this._user } });
            });
        } else {
            Payments.collection.find({}).fetch().forEach((pay) => {
                Payments.update(pay._id, { $set: { received: false, modification_user: this._user } });
            });
        }
    }

    /**
     * Return Total price
     * @param {Item} _pItem 
     */
    getTotalPrice(_pItem: Item, _pOrderItemQuantity: number): number {
        return _pItem.restaurants.filter(p => p.restaurantId === this.call.restaurant_id)[0].price * _pOrderItemQuantity;
    }

    /**
     * Return Total Garnish Food Price
     */
    getGarnishFoodTotalPrice(_pGarnishFood: GarnishFood, _pOrderItemQuantity: number): number {
        return _pGarnishFood.restaurants.filter(g => g.restaurantId === this.call.restaurant_id)[0].price * _pOrderItemQuantity;
    }

    /**
     * Return Total addition Price
     * @param {Addition} _pAddition 
     */
    getAdditionTotalPrice(_pAddition: Addition, _pOrderItemQuantity: number): number {
        return _pAddition.restaurants.filter(a => a.restaurantId === this.call.restaurant_id)[0].price * _pOrderItemQuantity;
    }

    /**
     * Return Payment method name
     * @param {string} _pPayId
     */
    getPaymentMethod(_pPayId: string): string {
        let _lPayment = PaymentMethods.findOne({ _id: _pPayId });
        if (_lPayment) {
            return _lPayment.name;
        } else {
            return '';
        }
    }

    /**
     * Function to translate information
     * @param {string} _itemName
     */
    itemNameTraduction(_itemName: string): string {
        var _wordTraduced: string;
        this._translate.get(_itemName).subscribe((res: string) => {
            _wordTraduced = res;
        });
        return _wordTraduced;
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}