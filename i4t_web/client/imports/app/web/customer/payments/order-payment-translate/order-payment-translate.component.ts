import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { Router } from '@angular/router';
import { MatDialogRef, MatDialog } from '@angular/material';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { OrderToTranslateComponent } from './order-to-translate/order-to-translate.component';
import { Order, OrderTranslateInfo } from '../../../../../../../both/models/restaurant/order.model';
import { Orders } from '../../../../../../../both/collections/restaurant/order.collection';
import { Currency } from '../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../both/collections/general/currency.collection';
import { UserDetails } from '../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../both/models/auth/user-detail.model';
import { Table } from '../../../../../../../both/models/restaurant/table.model';
import { Tables } from '../../../../../../../both/collections/restaurant/table.collection';
import { Restaurant } from '../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../../both/collections/restaurant/restaurant.collection';
import { Users } from '../../../../../../../both/collections/auth/user.collection';
import { User } from '../../../../../../../both/models/auth/user.model';
import { AlertConfirmComponent } from '../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'order-payment-translate',
    templateUrl: './order-payment-translate.component.html',
    styleUrls: ['./order-payment-translate.component.scss']
})
export class OrderPaymentTranslateComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _userDetailsSub: Subscription;
    private _restaurantSub: Subscription;
    private _tableSub: Subscription;
    private _ordersSub: Subscription;
    private _currencySub: Subscription;
    private _usersSub: Subscription;

    private _ordersToConfirm: Observable<Order[]>;
    private _ordersWithPendingConfirmation: Observable<Order[]>;

    public _dialogRef: MatDialogRef<any>;
    private _restaurantId: string;
    private _currencyCode: string;
    private _tableId: string;
    private _currencyId: string;
    private _showPaymentInfo: boolean = true;
    private titleMsg: string;
    private btnAcceptLbl: string;

    /**
     * OrderPaymentTranslateComponent Constructor
     * @param { TranslateService } _translate 
     * @param { NgZone } _ngZone 
     * @param { MatDialog } _dialog
     * @param { Router } _router
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        public _dialog: MatDialog,
        private _router: Router,
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
                            this._tableSub = MeteorObservable.subscribe('getTableByCurrentTable', this._user).subscribe(() => {
                                this._ngZone.run(() => {
                                    let _lTable: Table = Tables.findOne({ _id: _lUserDetail.current_table });
                                    this._tableId = _lTable._id;
                                    this._ordersSub = MeteorObservable.subscribe('getOrdersWithConfirmationPending', this._restaurantId, this._tableId).subscribe(() => {
                                        this._ngZone.run(() => {
                                            this._ordersToConfirm = Orders.find({
                                                status: 'ORDER_STATUS.PENDING_CONFIRM',
                                                'translateInfo.firstOrderOwner': this._user,
                                                'translateInfo.lastOrderOwner': { $not: '' }
                                            }).zone();
                                            this._ordersWithPendingConfirmation = Orders.find({
                                                status: 'ORDER_STATUS.PENDING_CONFIRM',
                                                'translateInfo.lastOrderOwner': this._user
                                            }).zone();
                                        });
                                    });
                                    this._usersSub = MeteorObservable.subscribe('getUserByTableId', this._restaurantId, this._tableId).subscribe();
                                });
                            });
                        });
                    });
                    this._showPaymentInfo = true;
                } else {
                    this._showPaymentInfo = false;
                }
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._userDetailsSub) { this._userDetailsSub.unsubscribe(); }
        if (this._restaurantSub) { this._restaurantSub.unsubscribe(); }
        if (this._tableSub) { this._tableSub.unsubscribe(); }
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._currencySub) { this._currencySub.unsubscribe(); }
        if (this._usersSub) { this._usersSub.unsubscribe(); }
    }

    /**
     * Open dialog
     */
    open() {
        this._dialogRef = this._dialog.open(OrderToTranslateComponent, {
            disableClose: true,
        });
        this._dialogRef.componentInstance._restaurantId = this._restaurantId;
        this._dialogRef.componentInstance._tableId = this._tableId;
        this._dialogRef.componentInstance._currencyId = this._currencyId;
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = null;
        });
    }

    /**
     * Function to confirm order pay translate
     * @param {Order} _pOrder 
     */
    confirmOrderToPay(_pOrder: Order): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        let _lMessageUSer: string = this.itemNameTraduction('ORDER_PAYMENT_TRANS.THE_USER');
        let _lMessageWantsToPay: string = this.itemNameTraduction('ORDER_PAYMENT_TRANS.WANTS_PAY');
        let _lMessageAgree: string = this.itemNameTraduction('ORDER_PAYMENT_TRANS.AGREE');

        this._dialogRef = this._dialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: this.itemNameTraduction('ORDER_PAYMENT_TRANS.DIALOG_TITLE'),
                subtitle: '',
                content: _lMessageUSer + this.getUserName(_pOrder.translateInfo.lastOrderOwner) + _lMessageWantsToPay + _pOrder.code + _lMessageAgree,
                buttonCancel: this.itemNameTraduction('NO'),
                buttonAccept: this.itemNameTraduction('YES'),
                showCancel: true
            }
        });
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = result;
            if (result.success) {
                let _lUser = _pOrder.translateInfo.lastOrderOwner;
                Orders.update({ _id: _pOrder._id }, {
                    $set: {
                        creation_user: _lUser, modification_user: this._user, modification_date: new Date(),
                        'translateInfo.confirmedToTranslate': true, status: 'ORDER_STATUS.DELIVERED'
                    }
                }
                );
            } else {
                let _lOrderTranslate: OrderTranslateInfo = { firstOrderOwner: _pOrder.translateInfo.firstOrderOwner, markedToTranslate: false, lastOrderOwner: '', confirmedToTranslate: false };
                Orders.update({ _id: _pOrder._id }, {
                    $set: {
                        modification_user: this._user, modification_date: new Date(),
                        translateInfo: _lOrderTranslate, status: 'ORDER_STATUS.DELIVERED'
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
     * Return To Payments Component
     */
    returnToPaymentsComponent(): void {
        this._router.navigate(['app/payments']);
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
    * This function open de error dialog according to parameters 
    * @param {string} title
    * @param {string} subtitle
    * @param {string} content
    * @param {string} btnCancelLbl
    * @param {string} btnAcceptLbl
    * @param {boolean} showBtnCancel
    */
    openDialog(title: string, subtitle: string, content: string, btnCancelLbl: string, btnAcceptLbl: string, showBtnCancel: boolean) {

        this._dialogRef = this._dialog.open(AlertConfirmComponent, {
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
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = result;
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