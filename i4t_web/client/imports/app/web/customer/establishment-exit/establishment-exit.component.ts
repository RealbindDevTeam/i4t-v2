import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../services/general/user-language.service';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../both/models/auth/user-detail.model';
import { Table } from '../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../both/collections/establishment/table.collection';
import { Order } from '../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../both/collections/establishment/order.collection';
import { WaiterCallDetails } from '../../../../../../both/collections/establishment/waiter-call-detail.collection';
import { AlertConfirmComponent } from '../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'establishment-exit',
    templateUrl: './establishment-exit.component.html',
    styleUrls: ['./establishment-exit.component.scss']
})
export class EstablishmentExitComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _userDetailsSub: Subscription;
    private _ordersSub: Subscription;
    private _waiterCallDetSub: Subscription;
    private _tablesSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _userDetails: Observable<UserDetail[]>;
    private _tables: Observable<Table[]>;
    private _orders: Observable<Order[]>;

    private _dialogRef: MatDialogRef<any>;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _loading: boolean = false;
    private _establishment_code: string = '';
    private _table_code: string = '';

    /**
     * EstablishmentExitComponent Constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService
     * @param {MatDialog} _mdDialog
     * @param {MatSnackBar} _snackBar
     * @param {Router} _router
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog,
        public _snackBar: MatSnackBar,
        private _router: Router) {
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
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByUser', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetails = UserDetails.find({}).zone();
            });
        });
        this._ordersSub = MeteorObservable.subscribe('getOrdersByUserId', this._user, ['ORDER_STATUS.SELECTING', 'ORDER_STATUS.CONFIRMED']).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._orders = Orders.find({}).zone();
            });
        });
        this._waiterCallDetSub = MeteorObservable.subscribe('countWaiterCallDetailByUsrId', this._user).takeUntil(this._ngUnsubscribe).subscribe();
        this._tablesSub = MeteorObservable.subscribe('getTableByCurrentTable', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._tables = Tables.find({}).zone();
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
     * Allow user exit establishment table
     */
    exitEstablishmentTable(_pCurrentEstablishment: string, _pCurrentTable: string): void {
        this._establishment_code = _pCurrentEstablishment;
        this._table_code = _pCurrentTable;

        let _lOrdersSelectingStatus: number = Orders.collection.find({
            creation_user: this._user, establishment_id: _pCurrentEstablishment, tableId: _pCurrentTable,
            status: 'ORDER_STATUS.SELECTING'
        }).count();

        let _lOrdersConfirmedStatus: number = Orders.collection.find({
            creation_user: this._user, establishment_id: _pCurrentEstablishment, tableId: _pCurrentTable,
            status: 'ORDER_STATUS.CONFIRMED'
        }).count();

        let _lUserWaiterCallsCount: number = WaiterCallDetails.collection.find({
            establishment_id: _pCurrentEstablishment, table_id: _pCurrentTable,
            type: 'CALL_OF_CUSTOMER', user_id: this._user, status: { $in: ['waiting', 'completed'] }
        }).count();

        if (_lOrdersSelectingStatus === 0 && _lOrdersConfirmedStatus === 0 && _lUserWaiterCallsCount === 0) {
            this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                disableClose: true,
                data: {
                    title: this.itemNameTraduction('EXIT_TABLE.RESTAURANT_EXIT'),
                    subtitle: '',
                    content: this.itemNameTraduction('EXIT_TABLE.RESTAURANT_EXIT_CONFIRM'),
                    buttonCancel: this.itemNameTraduction('NO'),
                    buttonAccept: this.itemNameTraduction('YES'),
                    showCancel: true
                }
            });
            this._dialogRef.afterClosed().subscribe(result => {
                this._dialogRef = result;
                if (result.success) {
                    this._loading = true;
                    setTimeout(() => {
                        this.executeEstablishmentExit().then((result) => {
                            if (result) {
                                this._loading = false;
                                let _lMessage: string = this.itemNameTraduction('EXIT_TABLE.LEAVE_RESTAURANT_MSG');
                                this._snackBar.open(_lMessage, '', { duration: 2500 });
                                this.goToOrders();
                            } else {
                                this._loading = false;
                                let _lErrorMessage: string = this.itemNameTraduction('EXIT_TABLE.ERROR_LEAVE_RESTAURANT');
                                this._snackBar.open(_lErrorMessage, '', { duration: 2500 });
                            }
                        }).catch((err) => {
                            this._loading = false;
                            let _lErrorMessage: string = this.itemNameTraduction('EXIT_TABLE.ERROR_LEAVE_RESTAURANT');
                            this._snackBar.open(_lErrorMessage, '', { duration: 2500 });
                        });
                    }, 1500);
                }
            });
        } else if (_lOrdersSelectingStatus > 0 && _lOrdersConfirmedStatus === 0 && _lUserWaiterCallsCount === 0) {
            this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                disableClose: true,
                data: {
                    title: this.itemNameTraduction('EXIT_TABLE.ORDERS_SELECTED'),
                    subtitle: '',
                    content: this.itemNameTraduction('EXIT_TABLE.ORDERS_CANCEL_CONFIRM'),
                    buttonCancel: this.itemNameTraduction('NO'),
                    buttonAccept: this.itemNameTraduction('YES'),
                    showCancel: true
                }
            });
            this._dialogRef.afterClosed().subscribe(result => {
                this._dialogRef = result;
                if (result.success) {
                    this._loading = true;
                    setTimeout(() => {
                        this.executeEstablishmentExitWithSelectedOrders().then((result) => {
                            if (result) {
                                this._loading = false;
                                let _lMessage: string = this.itemNameTraduction('EXIT_TABLE.LEAVE_RESTAURANT_MSG');
                                this._snackBar.open(_lMessage, '', { duration: 2500 });
                                this.goToOrders();
                            } else {
                                this._loading = false;
                                let _lErrorMessage: string = this.itemNameTraduction('EXIT_TABLE.ERROR_LEAVE_RESTAURANT');
                                this._snackBar.open(_lErrorMessage, '', { duration: 2500 });
                            }
                        }).catch((err) => {
                            this._loading = false;
                            let _lErrorMessage: string = this.itemNameTraduction('EXIT_TABLE.ERROR_LEAVE_RESTAURANT');
                            this._snackBar.open(_lErrorMessage, '', { duration: 2500 });
                        });
                    }, 1500);
                }
            });
        } else if (_lUserWaiterCallsCount > 0) {
            this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                disableClose: true,
                data: {
                    title: this.itemNameTraduction('EXIT_TABLE.PENDING_WAITER_CALL'),
                    subtitle: '',
                    content: this.itemNameTraduction('EXIT_TABLE.WAITER_CALLS_MSG'),
                    buttonCancel: '',
                    buttonAccept: this.itemNameTraduction('EXIT_TABLE.ACCEPT'),
                    showCancel: false
                }
            });
        } else if (_lOrdersConfirmedStatus > 0) {
            this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                disableClose: true,
                data: {
                    title: this.itemNameTraduction('EXIT_TABLE.ORDERS_CONFIRMED'),
                    subtitle: '',
                    content: this.itemNameTraduction('EXIT_TABLE.ORDERS_CONFIRMED_MSG'),
                    buttonCancel: '',
                    buttonAccept: this.itemNameTraduction('EXIT_TABLE.ACCEPT'),
                    showCancel: false
                }
            });
        } else {
            this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                disableClose: true,
                data: {
                    title: this.itemNameTraduction('EXIT_TABLE.RESTAURANT_EXIT'),
                    subtitle: '',
                    content: this.itemNameTraduction('EXIT_TABLE.GENERAL_ERROR'),
                    buttonCancel: '',
                    buttonAccept: this.itemNameTraduction('EXIT_TABLE.ACCEPT'),
                    showCancel: false
                }
            });
        }
    }

    /**
     * Promise to validate user exit
     */
    executeEstablishmentExit(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                MeteorObservable.call('establishmentExit', this._user, this._establishment_code, this._table_code).subscribe((result) => {
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
                MeteorObservable.call('establishmentExitWithSelectedOrders', this._user, this._establishment_code, this._table_code).subscribe((result) => {
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
     * This function allow go to Orders
     */
    goToOrders() {
        this._router.navigate(['/app/orders']);
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}