import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
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
import { Order } from '../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../both/collections/establishment/order.collection';
import { Payments } from '../../../../../../both/collections/establishment/payment.collection';
import { WaiterCallDetails } from '../../../../../../both/collections/establishment/waiter-call-detail.collection';
import { Account } from '../../../../../../both/models/establishment/account.model';
import { Accounts } from '../../../../../../both/collections/establishment/account.collection';
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
    private _paymentsSub: Subscription;
    private _waiterCallDetSub: Subscription;
    private _tablesSub: Subscription;
    private _accountsSub: Subscription;

    private _userDetails: Observable<UserDetail[]>;
    private _tables: Observable<Table[]>;
    private _orders: Observable<Order[]>;

    private _dialogRef: MatDialogRef<any>;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _showWaiterCard: boolean = false;
    private _loading: boolean = false;

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
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByUser', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetails = UserDetails.find({}).zone();
            });
        });
        this._ordersSub = MeteorObservable.subscribe('getOrdersByUserId', this._user, ['ORDER_STATUS.REGISTERED', 'ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED',
            'ORDER_STATUS.DELIVERED', 'ORDER_STATUS.PENDING_CONFIRM']).subscribe(() => {
                this._ngZone.run(() => {
                    this._orders = Orders.find({}).zone();
                    this._orders.subscribe(() => { this.validateOrdersMarkedToCancel(); });
                });
            });
        this._paymentsSub = MeteorObservable.subscribe('getUserPayments', this._user).subscribe();
        this._waiterCallDetSub = MeteorObservable.subscribe('countWaiterCallDetailByUsrId', this._user).subscribe();
        this._tablesSub = MeteorObservable.subscribe('getTableByCurrentTable', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._tables = Tables.find({}).zone();
            });
        });
        this._accountsSub = MeteorObservable.subscribe('getAccountsByUserId', this._user).subscribe();
    }

    /**
     * Validate orders marked to cancel
     */
    validateOrdersMarkedToCancel(): void {
        let _lOrdersToCancelCount: number = Orders.collection.find({ creation_user: this._user, status: { $in: ['ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED'] }, markedToCancel: true }).count();
        _lOrdersToCancelCount > 0 ? this._showWaiterCard = true : this._showWaiterCard = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._userDetailsSub) { this._userDetailsSub.unsubscribe(); }
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._paymentsSub) { this._paymentsSub.unsubscribe(); }
        if (this._waiterCallDetSub) { this._waiterCallDetSub.unsubscribe(); }
        if (this._tablesSub) { this._tablesSub.unsubscribe(); }
        if (this._accountsSub) { this._accountsSub.unsubscribe(); }
    }

    /**
     * Allow user exit establishment table
     */
    exitEstablishmentTable(_pUserDetailId: string, _pCurrentEstablishment: string, _pCurrentTable: string): void {

        let _lUserAccount: Account = Accounts.findOne({ establishment_id: _pCurrentEstablishment, tableId: _pCurrentTable, status: 'OPEN' });

        if (_lUserAccount) {

            let _lOrdersRegisteredStatus: number = Orders.collection.find({
                creation_user: this._user, establishment_id: _pCurrentEstablishment, accountId: _lUserAccount._id,
                tableId: _pCurrentTable, status: 'ORDER_STATUS.REGISTERED'
            }).count();
            let _lOrdersInProcessStatus: number = Orders.collection.find({
                creation_user: this._user, establishment_id: _pCurrentEstablishment, accountId: _lUserAccount._id,
                tableId: _pCurrentTable, status: 'ORDER_STATUS.IN_PROCESS'
            }).count();
            let _lOrdersPreparedStatus: number = Orders.collection.find({
                creation_user: this._user, establishment_id: _pCurrentEstablishment, accountId: _lUserAccount._id,
                tableId: _pCurrentTable, status: 'ORDER_STATUS.PREPARED'
            }).count();
            let _lOrdersDeliveredStatus: number = Orders.collection.find({
                creation_user: this._user, establishment_id: _pCurrentEstablishment, accountId: _lUserAccount._id,
                tableId: _pCurrentTable, status: 'ORDER_STATUS.DELIVERED', toPay: false
            }).count();
            let _lOrdersToConfirm: number = Orders.collection.find({
                establishment_id: _pCurrentEstablishment, tableId: _pCurrentTable, 'translateInfo.firstOrderOwner': this._user,
                accountId: _lUserAccount._id, 'translateInfo.markedToTranslate': true, status: 'ORDER_STATUS.PENDING_CONFIRM', toPay: false
            }).count();
            let _lOrdersWithPendingConfirmation: number = Orders.collection.find({
                establishment_id: _pCurrentEstablishment, tableId: _pCurrentTable, 'translateInfo.lastOrderOwner': this._user,
                accountId: _lUserAccount._id, 'translateInfo.markedToTranslate': true, status: 'ORDER_STATUS.PENDING_CONFIRM', toPay: false
            }).count();
            let _lUserWaiterCallsCount: number = WaiterCallDetails.collection.find({
                establishment_id: _pCurrentEstablishment, table_id: _pCurrentTable,
                type: 'CALL_OF_CUSTOMER', user_id: this._user, status: { $in: ['waiting', 'completed'] }
            }).count();
            let _lUserPaymentsCount: number = Payments.collection.find({
                creation_user: this._user, establishment_id: _pCurrentEstablishment, accountId: _lUserAccount._id,
                tableId: _pCurrentTable, status: 'PAYMENT.NO_PAID', received: false
            }).count();

            if (_lOrdersRegisteredStatus === 0 && _lOrdersInProcessStatus === 0 && _lOrdersPreparedStatus === 0
                && _lOrdersDeliveredStatus === 0 && _lOrdersToConfirm === 0 && _lOrdersWithPendingConfirmation === 0
                && _lUserWaiterCallsCount === 0 && _lUserPaymentsCount === 0) {
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
                            MeteorObservable.call('establishmentExit', _pUserDetailId, _pCurrentEstablishment, _pCurrentTable).subscribe(() => {
                                this._loading = false;
                                let _lMessage: string = this.itemNameTraduction('EXIT_TABLE.LEAVE_RESTAURANT_MSG');
                                this._snackBar.open(_lMessage, '', { duration: 2500 });
                                this.goToOrders();
                            });
                        }, 1500);
                    }
                });
            } else {
                if (_lOrdersRegisteredStatus > 0 && _lOrdersInProcessStatus === 0 && _lOrdersPreparedStatus === 0
                    && _lOrdersDeliveredStatus === 0 && _lOrdersToConfirm === 0 && _lOrdersWithPendingConfirmation === 0
                    && _lUserWaiterCallsCount === 0 && _lUserPaymentsCount === 0) {
                    this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                        disableClose: true,
                        data: {
                            title: this.itemNameTraduction('EXIT_TABLE.ORDERS_REGISTERED'),
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
                                MeteorObservable.call('establishmentExitWithRegisteredOrders', this._user, _pUserDetailId, _pCurrentEstablishment, _pCurrentTable).subscribe(() => {
                                    this._loading = false;
                                    let _lMessage: string = this.itemNameTraduction('EXIT_TABLE.LEAVE_RESTAURANT_MSG');
                                    this._snackBar.open(_lMessage, '', { duration: 2500 });
                                    this.goToOrders();
                                });
                            }, 1500);
                        }
                    });
                } else {
                    if ((_lOrdersToConfirm > 0 || _lOrdersWithPendingConfirmation > 0) && _lOrdersRegisteredStatus === 0 && _lOrdersInProcessStatus === 0
                        && _lOrdersPreparedStatus === 0 && _lOrdersDeliveredStatus === 0 && _lUserWaiterCallsCount === 0
                        && _lUserPaymentsCount === 0) {
                        this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                            disableClose: true,
                            data: {
                                title: this.itemNameTraduction('EXIT_TABLE.ORDERS_PENDING_CONFIRM'),
                                subtitle: '',
                                content: this.itemNameTraduction('EXIT_TABLE.ORDERS_MUST_BE_ATTENDED'),
                                buttonCancel: '',
                                buttonAccept: this.itemNameTraduction('EXIT_TABLE.ACCEPT'),
                                showCancel: false
                            }
                        });
                    } else {
                        if (_lUserWaiterCallsCount > 0 && _lOrdersRegisteredStatus === 0 && _lOrdersInProcessStatus === 0
                            && _lOrdersPreparedStatus === 0 && _lOrdersDeliveredStatus === 0 && _lOrdersToConfirm === 0
                            && _lOrdersWithPendingConfirmation === 0 && _lUserPaymentsCount === 0) {
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
                        } else {
                            if (_lUserPaymentsCount > 0 && _lOrdersRegisteredStatus === 0 && _lOrdersInProcessStatus === 0
                                && _lOrdersPreparedStatus === 0 && _lOrdersDeliveredStatus === 0 && _lOrdersToConfirm === 0
                                && _lOrdersWithPendingConfirmation === 0 && _lUserWaiterCallsCount === 0) {
                                this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                                    disableClose: true,
                                    data: {
                                        title: this.itemNameTraduction('EXIT_TABLE.PENDING_PAYMENTS'),
                                        subtitle: '',
                                        content: this.itemNameTraduction('EXIT_TABLE.PENDING_PAYMENTS_MSG'),
                                        buttonCancel: '',
                                        buttonAccept: this.itemNameTraduction('EXIT_TABLE.ACCEPT'),
                                        showCancel: false
                                    }
                                });
                            } else {
                                if (_lOrdersDeliveredStatus > 0 && _lOrdersRegisteredStatus === 0 && _lOrdersInProcessStatus === 0
                                    && _lOrdersPreparedStatus === 0 && _lOrdersToConfirm === 0 && _lOrdersWithPendingConfirmation === 0
                                    && _lUserWaiterCallsCount === 0 && _lUserPaymentsCount === 0) {
                                    this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                                        disableClose: true,
                                        data: {
                                            title: this.itemNameTraduction('EXIT_TABLE.ORDERS_DELIVERED'),
                                            subtitle: '',
                                            content: this.itemNameTraduction('EXIT_TABLE.ORDERS_DELIVERED_MSG'),
                                            buttonCancel: '',
                                            buttonAccept: this.itemNameTraduction('EXIT_TABLE.ACCEPT'),
                                            showCancel: false
                                        }
                                    });
                                } else {
                                    this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                                        disableClose: true,
                                        data: {
                                            title: this.itemNameTraduction('EXIT_TABLE.INVALID_OPERATION'),
                                            subtitle: '',
                                            content: this.itemNameTraduction('EXIT_TABLE.CALL_WAITER_MSG'),
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
                                                MeteorObservable.call('establishmentExitWithOrdersInInvalidStatus', this._user, _pCurrentEstablishment, _pCurrentTable).subscribe(() => {
                                                    this._loading = false;
                                                    this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                                                        disableClose: true,
                                                        data: {
                                                            title: this.itemNameTraduction('EXIT_TABLE.WAITER_ON_THE_WAY'),
                                                            subtitle: '',
                                                            content: this.itemNameTraduction('EXIT_TABLE.WAITER_ON_THE_WAY_CALL'),
                                                            buttonCancel: '',
                                                            buttonAccept: this.itemNameTraduction('EXIT_TABLE.ACCEPT'),
                                                            showCancel: false
                                                        }
                                                    });
                                                });
                                            }, 1500);
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
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
     * Function to cancel waiter call
     * @param {string} _pCurrentEstablishment
     * @param {string} _pCurrentTable 
     */
    cancelWaiterCall(_pCurrentEstablishment: string, _pCurrentTable: string): void {
        this._loading = true;
        Orders.find({
            creation_user: this._user, establishment_id: _pCurrentEstablishment, tableId: _pCurrentTable, markedToCancel: true,
            status: { $in: ['ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED'] }
        }).fetch().forEach((order) => {
            Orders.update({ _id: order._id }, { $set: { markedToCancel: null, modification_date: new Date() } });
        });
        setTimeout(() => {
            let waiterCall = WaiterCallDetails.findOne({ user_id: this._user, type: 'USER_EXIT_TABLE', establishment_id: _pCurrentEstablishment, table_id: _pCurrentTable, status: { $in: ["waiting", "completed"] } });
            if (waiterCall) {
                MeteorObservable.call('cancelCallClient', waiterCall, Meteor.userId()).subscribe(() => {
                    this._loading = false;
                    let _lMessage: string = this.itemNameTraduction('EXIT_TABLE.CALLED_CANCELED')
                    this._snackBar.open(_lMessage, '', {
                        duration: 2500
                    });
                });
            }
        }, 1500);
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}