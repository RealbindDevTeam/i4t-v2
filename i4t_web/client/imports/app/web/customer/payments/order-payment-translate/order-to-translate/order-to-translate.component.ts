import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Observable, Subscription } from 'rxjs';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Order, OrderTranslateInfo } from '../../../../../../../../both/models/restaurant/order.model';
import { Orders } from '../../../../../../../../both/collections/restaurant/order.collection';
import { Item, ItemImage } from '../../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../../both/collections/menu/item.collection';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { Addition } from '../../../../../../../../both/models/menu/addition.model';
import { Additions } from '../../../../../../../../both/collections/menu/addition.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'order-to-translate',
    templateUrl: './order-to-translate.component.html',
    styleUrls: ['./order-to-translate.component.scss'],
    providers: [UserLanguageService]
})
export class OrderToTranslateComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    public _restaurantId: string;
    public _tableId: string;
    public _currencyId: string;

    private _ordersSub: Subscription;
    private _itemsSub: Subscription;
    private _currencySub: Subscription;
    private _additionsSub: Subscription;
    private _mdDialogRef: MatDialogRef<any>;

    private _ordersTable: Observable<Order[]>;
    private _items: Observable<Item[]>;
    private _additions: Observable<Addition[]>;

    private _orderOthersIndex: number = -1;
    private _currencyCode: string;
    private titleMsg: string;
    private btnAcceptLbl: string;

    /**
     * OrderToTranslateComponent constructor
     * @param {TranslateService} translate
     * @param {MatDialogRef<any>} _dialogRef
     * @param {NgZone} _ngZone
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _translate: TranslateService,
        public _dialogRef: MatDialogRef<any>,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
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
        this._ordersSub = MeteorObservable.subscribe('getOrdersByTableId', this._restaurantId, this._tableId, ['ORDER_STATUS.DELIVERED']).subscribe(() => {
            this._ngZone.run(() => {
                this._ordersTable = Orders.find({
                    creation_user: { $not: this._user }, status: 'ORDER_STATUS.DELIVERED', 'translateInfo.lastOrderOwner': '',
                    'translateInfo.markedToTranslate': false, 'translateInfo.confirmedToTranslate': false, toPay: false
                }).zone();
            });
        });
        this._itemsSub = MeteorObservable.subscribe('itemsByRestaurant', this._restaurantId).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
            });
        });
        this._currencySub = MeteorObservable.subscribe('getCurrenciesByRestaurantsId', [this._restaurantId]).subscribe(() => {
            this._ngZone.run(() => {
                let _lCurrency: Currency = Currencies.findOne({ _id: this._currencyId });
                this._currencyCode = _lCurrency.code;
            });
        });
        this._additionsSub = MeteorObservable.subscribe('additionsByRestaurant', this._restaurantId).subscribe(() => {
            this._ngZone.run(() => {
                this._additions = Additions.find({}).zone();
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._itemsSub) { this._itemsSub.unsubscribe(); }
        if (this._currencySub) { this._currencySub.unsubscribe(); }
        if (this._additionsSub) { this._additionsSub.unsubscribe(); }
    }

    /**
     * Show table order detail
     * @param {Order} _pOrder 
     * @param {number} _pIndex
     */
    showOthersOrderDetail(_pOrder: Order, _pIndex: number): void {
        if (this._orderOthersIndex == _pIndex) {
            this._orderOthersIndex = -1;
        } else {
            this._orderOthersIndex = _pIndex;
        }
    }

    /**
     * 
     */
    close(): void {
        this._dialogRef.close();
    }

    /**
     * Mark order to confirm if is accepted to translate payment
     * @param {Order} _pOrder
     */
    markOrderToPay(_pOrder: Order): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        let _lMessagePay: string = this.itemNameTraduction('ORDER_TRANS.ORDER_PAY');
        let _lMessageUser: string = this.itemNameTraduction('ORDER_TRANS.USER_CONFIRM');
        let _lMessageNoPay: string = this.itemNameTraduction('ORDER_TRANS.NO_PAY_POSSIBLE');
        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: this.itemNameTraduction('ORDER_TRANS.PAY_ORDER_DLG'),
                subtitle: '',
                content: _lMessagePay + _pOrder.code + '?',
                buttonCancel: this.itemNameTraduction('NO'),
                buttonAccept: this.itemNameTraduction('YES'),
                showCancel: true
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                if (_pOrder.status === 'ORDER_STATUS.DELIVERED') {
                    let _lOrderTranslate: OrderTranslateInfo = { firstOrderOwner: _pOrder.creation_user, markedToTranslate: true, lastOrderOwner: this._user, confirmedToTranslate: false };
                    Orders.update({ _id: _pOrder._id }, {
                        $set: {
                            status: 'ORDER_STATUS.PENDING_CONFIRM', modification_user: this._user,
                            modification_date: new Date(), translateInfo: _lOrderTranslate
                        }
                    }
                    );
                    this.openDialog(this.titleMsg, '', _lMessageUser, '', this.btnAcceptLbl, false);
                } else {
                    this.openDialog(this.titleMsg, '', _lMessageNoPay, '', this.btnAcceptLbl, false);
                }
                this.close();
            }
        });
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

        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
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