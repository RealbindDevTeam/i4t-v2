import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatSnackBar } from '@angular/material';
import { Observable, Subscription, Subject } from 'rxjs';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { WaiterCallDetail } from '../../../../../../../both/models/establishment/waiter-call-detail.model';
import { Order } from '../../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../../both/collections/establishment/order.collection';
import { Users } from '../../../../../../../both/collections/auth/user.collection';
import { User } from '../../../../../../../both/models/auth/user.model';
import { Item } from '../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../both/collections/menu/item.collection';
import { Table } from '../../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../../both/collections/establishment/table.collection';
import { Addition } from '../../../../../../../both/models/menu/addition.model';
import { Additions } from '../../../../../../../both/collections/menu/addition.collection';
import { Option } from '../../../../../../../both/models/menu/option.model';
import { Options } from '../../../../../../../both/collections/menu/option.collection';
import { OptionValue } from '../../../../../../../both/models/menu/option-value.model';
import { OptionValues } from '../../../../../../../both/collections/menu/option-value.collection';

@Component({
    selector: 'customer-order-confirm',
    templateUrl: './customer-order-confirm.component.html',
    styleUrls: ['./customer-order-confirm.component.scss'],
    providers: [UserLanguageService]
})
export class CustomerOrderConfirmComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    public call: WaiterCallDetail;

    private _ordersSub: Subscription;
    private _usersSub: Subscription;
    private _itemsSub: Subscription;
    private _tablesSub: Subscription;
    private _additionsSub: Subscription;
    private _optionSub: Subscription;
    private _optionValuesSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _orders: Observable<Order[]>;
    private _items: Observable<Item[]>;
    private _additions: Observable<Addition[]>;
    private _options: Observable<Option[]>;
    private _optionValues: Observable<OptionValue[]>;

    private _tableNumber: string;
    private _tableQRCode: string;
    private _loading: boolean = false;

    /**
     * CustomerOrderConfirmComponent constructor
     * @param {TranslateService} translate
     * @param {MatDialogRef<any>} _dialogRef
     * @param {NgZone} _ngZone
     * @param {UserLanguageService} _userLanguageService
     * @param {MatSnackBar} _snackBar
     */
    constructor(private _translate: TranslateService,
        public _dialogRef: MatDialogRef<any>,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        public _snackBar: MatSnackBar) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        let _optionIds: string[] = [];
        this.removeSubscriptions();
        this._ordersSub = MeteorObservable.subscribe('getOrderById', this.call.order_id).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._orders = Orders.find({ _id: this.call.order_id }).zone();
            });
        });

        this._usersSub = MeteorObservable.subscribe('getUserByTableId', this.call.establishment_id, this.call.table_id).takeUntil(this._ngUnsubscribe).subscribe();

        this._itemsSub = MeteorObservable.subscribe('itemsByEstablishment', this.call.establishment_id).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
            });
        });

        this._tablesSub = MeteorObservable.subscribe('getTablesByEstablishment', this.call.establishment_id).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let _lTable: Table = Tables.collection.find({ _id: this.call.table_id }).fetch()[0];
                this._tableNumber = _lTable._number + '';
                this._tableQRCode = _lTable.QR_code;
            });
        });

        this._additionsSub = MeteorObservable.subscribe('additionsByEstablishment', this.call.establishment_id).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._additions = Additions.find({}).zone();
            });
        });

        this._optionSub = MeteorObservable.subscribe('optionsByEstablishment', [this.call.establishment_id]).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._options = Options.find({ establishments: { $in: [this.call.establishment_id] }, is_active: true }).zone();
                this._options.subscribe(() => {
                    Options.find({ establishments: { $in: [this.call.establishment_id] }, is_active: true }).fetch().forEach((opt) => {
                        _optionIds.push(opt._id);
                    });
                    this._optionValuesSub = MeteorObservable.subscribe('getOptionValuesByOptionIds', _optionIds).takeUntil(this._ngUnsubscribe).subscribe(() => {
                        this._ngZone.run(() => {
                            this._optionValues = OptionValues.find({ option_id: { $in: _optionIds }, is_active: true }).zone();
                        });
                    });
                });
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
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
     * Close PaymentConfirm Dialog
     */
    close(): void {
        this._dialogRef.close();
    }

    /**
     * Function to receive order
     */
    receiveOrder(): void {
        this._loading = true;
        setTimeout(() => {
            MeteorObservable.call('closeCall', this.call, this._user).subscribe(() => {
                this._loading = false;
                let _lMessage: string = this.itemNameTraduction('CUSTOMER_ORDER.RECEIVE_ORDER_CONFIRM');
                this._snackBar.open(_lMessage, '', { duration: 3000 });
                this.close();
            });
        }, 1500);
    }

    /**
     * Function to cancel order
     */
    cancelOrder(): void {
        this._loading = true;
        setTimeout(() => {
            MeteorObservable.call('cancelOrderCall', this.call, this._user).subscribe(() => {
                this._loading = false;
                let _lMessage: string = this.itemNameTraduction('CUSTOMER_ORDER.CANCEL_ORDER_CONFIRM');
                this._snackBar.open(_lMessage, '', { duration: 3000 });
                this.close();
            });
        }, 1500);
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
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}