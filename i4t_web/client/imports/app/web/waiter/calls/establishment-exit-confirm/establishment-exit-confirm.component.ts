import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar, MatDialogRef } from '@angular/material';
import { Observable, Subscription } from 'rxjs';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { WaiterCallDetail } from '../../../../../../../both/models/establishment/waiter-call-detail.model';
import { Order } from '../../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../../both/collections/establishment/order.collection';
import { Item } from '../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../both/collections/menu/item.collection';
import { Table } from '../../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../../both/collections/establishment/table.collection';
import { Additions } from '../../../../../../../both/collections/menu/addition.collection';
import { Addition } from '../../../../../../../both/models/menu/addition.model';
import { GarnishFood } from '../../../../../../../both/models/menu/garnish-food.model';
import { GarnishFoodCol } from '../../../../../../../both/collections/menu/garnish-food.collection';
import { UserDetails } from '../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../both/models/auth/user-detail.model';
import { Users } from '../../../../../../../both/collections/auth/user.collection';
import { User } from '../../../../../../../both/models/auth/user.model';
import { Accounts } from '../../../../../../../both/collections/establishment/account.collection';
import { Account } from '../../../../../../../both/models/establishment/account.model';

@Component({
    selector: 'establishment-exit-confirm',
    templateUrl: './establishment-exit-confirm.component.html',
    styleUrls: ['./establishment-exit-confirm.component.scss'],
    providers: [UserLanguageService]
})
export class EstablishmentExitConfirmComponent implements OnInit, OnDestroy {

    public call: WaiterCallDetail;

    private _user = Meteor.userId();
    private _userDetailsSub: Subscription;
    private _usersSub: Subscription;
    private _ordersSub: Subscription;
    private _itemsSub: Subscription;
    private _tablesSub: Subscription;
    private _additionsSub: Subscription;
    private _garnishFoodSub: Subscription;
    private _accountsSub: Subscription;

    private _orders: Observable<Order[]>;
    private _items: Observable<Item[]>;
    private _additions: Observable<Addition[]>;
    private _garnishFood: Observable<GarnishFood[]>;
    private _usersDetails: Observable<UserDetail[]>;

    private _tableNumber: string;
    private _loading: boolean = false;
    private _showError: boolean = false;

    /**
     * ExitTableConfirmComponent constructor
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
        this.removeSubscriptions();
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByCurrentTable', this.call.establishment_id, this.call.table_id).subscribe(() => {
            this._ngZone.run(() => {
                this._usersDetails = UserDetails.find({ current_establishment: this.call.establishment_id, current_table: this.call.table_id }).zone();
            });
        });
        this._usersSub = MeteorObservable.subscribe('getUserByTableId', this.call.establishment_id, this.call.table_id).subscribe();
        this._ordersSub = MeteorObservable.subscribe('getOrdersByTableId', this.call.establishment_id, this.call.table_id,
            ['ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED']).subscribe(() => {
                this._ngZone.run(() => {
                    this._orders = Orders.find({}).zone();
                });
            });
        this._itemsSub = MeteorObservable.subscribe('itemsByEstablishment', this.call.establishment_id).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
            });
        });
        this._tablesSub = MeteorObservable.subscribe('getTablesByEstablishment', this.call.establishment_id).subscribe(() => {
            this._ngZone.run(() => {
                let _lTable: Table = Tables.collection.find({ _id: this.call.table_id }).fetch()[0];
                this._tableNumber = _lTable._number + '';
            });
        });
        this._additionsSub = MeteorObservable.subscribe('additionsByEstablishmentWork', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._additions = Additions.find({}).zone();
            });
        });
        this._garnishFoodSub = MeteorObservable.subscribe('garnishFoodByEstablishmentWork', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._garnishFood = GarnishFoodCol.find({}).zone();
            });
        });
        this._accountsSub = MeteorObservable.subscribe('getAccountsByTableEstablishment', this.call.establishment_id, 'OPEN').subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._userDetailsSub) { this._userDetailsSub.unsubscribe(); }
        if (this._usersSub) { this._usersSub.unsubscribe(); }
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._itemsSub) { this._itemsSub.unsubscribe(); }
        if (this._tablesSub) { this._tablesSub.unsubscribe(); }
        if (this._additionsSub) { this._additionsSub.unsubscribe(); }
        if (this._garnishFoodSub) { this._garnishFoodSub.unsubscribe(); }
        if (this._accountsSub) { this._accountsSub.unsubscribe(); }
    }

    /**
     * Return User Name
     * @param {string} _pUserId 
     */
    getUserName(_pUserId: string): string {
        let _user: User = Users.findOne({ _id: _pUserId });
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
     * Cancel order user when user wants exit table
     * @param {Order} _pOrder 
     */
    cancelOrderToExitTable(_pOrder: Order): void {
        this._loading = true;
        setTimeout(() => {
            MeteorObservable.call('cancelOrderToEstablishmentExit', _pOrder, this.call, this._user).subscribe(() => {
                this._loading = false;
                let _lMessage: string = this.itemNameTraduction('EXIT_TABLE_CONFIRM.ORDER_CANCELED')
                this._snackBar.open(_lMessage, '', {
                    duration: 2500
                });
                let _lOrdersToCancel: number = Orders.collection.find({
                    establishment_id: this.call.establishment_id, tableId: this.call.table_id,
                    markedToCancel: { $in: [true, false] }, status: { $in: ['ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED'] }
                }).count();
                if (_lOrdersToCancel === 0) {
                    this.close();
                }
            }, (error) => {
                this._loading = false;
                if (error.error === '200') {
                    this._showError = true;
                } else {
                    this._showError = true;
                }
            });
        }, 1500);
    }

    /**
     * Close ExitTable Dialog
     */
    close(): void {
        this._dialogRef.close();
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