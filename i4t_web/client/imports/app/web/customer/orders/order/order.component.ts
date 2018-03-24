import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Subscription, Observable, Subject } from 'rxjs';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Table } from '../../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../../both/collections/establishment/table.collection';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { UserDetails } from '../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail, UserDetailImage } from '../../../../../../../both/models/auth/user-detail.model';
import { AlertConfirmComponent } from '../../../general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'orders',
    templateUrl: './order.component.html',
    styleUrls: ['./order.component.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _ordersForm: FormGroup;
    private _mdDialogRef: MatDialogRef<any>;

    private _tablesSub: Subscription;
    private _userDetailsSub: Subscription;
    private _establishmentSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _userDetails: Observable<UserDetail[]>;
    private _currentEstablishment: Establishment;
    private _currentQRCode: string;
    private titleMsg: string;
    private btnAcceptLbl: string;

    private _showError: boolean = false;
    private _showAlphanumericCodeCard: boolean = false;
    private _showNewOrderButton: boolean = false;
    private _showOrderCreation: boolean = false;
    private _showOrderList: boolean = false;
    private _showTableIsNotActiveError: boolean = false;
    private _loading: boolean = false;

    /**
     * OrdersComponent Constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._ordersForm = new FormGroup({
            qrCode: new FormControl('', [Validators.required, Validators.minLength(1)])
        });
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByUser', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetails = UserDetails.find({ user_id: this._user }).zone();
                this._userDetails.subscribe(() => { this.validateUser(); });
                let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: this._user });
                if (_lUserDetail.current_establishment !== "" && _lUserDetail.current_table !== "") {
                    this._establishmentSub = MeteorObservable.subscribe('getEstablishmentByCurrentUser', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
                        this._ngZone.run(() => {
                            let _lEstablishment: Establishment = Establishments.findOne({ _id: _lUserDetail.current_establishment });
                            let _lTable: Table = Tables.findOne({ _id: _lUserDetail.current_table });
                            this._currentEstablishment = _lEstablishment;
                            this._currentQRCode = _lTable.QR_code;
                            this._showAlphanumericCodeCard = false;
                            this._showOrderList = true;
                            this._showNewOrderButton = true;
                        });
                    });
                } else {
                    this._showAlphanumericCodeCard = true;
                    this._showOrderList = false;
                    this._showNewOrderButton = false;
                }
            });
        });
        this._tablesSub = MeteorObservable.subscribe('getAllTables').takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * This function validate if QR Code exists
     */
    validateQRCodeExists() {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._ordersForm.valid) {
            let _lTable: Table = Tables.findOne({ QR_code: this._ordersForm.value.qrCode });
            if (_lTable) {
                if (_lTable.is_active) {
                    this._loading = true;
                    setTimeout(() => {
                        MeteorObservable.call('getEstablishmentByQRCode', _lTable.QR_code, this._user).subscribe((_result: Establishment) => {
                            this._currentEstablishment = _result;
                            this._currentQRCode = _lTable.QR_code;
                            this._showAlphanumericCodeCard = false;
                            this._showOrderList = true;
                            this._showNewOrderButton = true;
                            this._loading = false;
                        }, (error) => {
                            if (error.error === '400') {
                                this._loading = false;
                                this.openDialog(this.titleMsg, '', this.itemNameTraduction('ORDERS.TABLE_NOT_EXISTS'), '', this.btnAcceptLbl, false);
                            } else if (error.error === '300') {
                                this._loading = false;
                                this.openDialog(this.titleMsg, '', this.itemNameTraduction('ORDERS.RESTAURANT_NOT_EXISTS'), '', this.btnAcceptLbl, false);
                            } else if (error.error === '200') {
                                this._loading = false;
                                this.openDialog(this.titleMsg, '', this.itemNameTraduction('ORDERS.IUREST_NO_ACTIVE'), '', this.btnAcceptLbl, false);
                            } else if (error.error === '500') {
                                this._loading = false;
                                this.openDialog(this.titleMsg, '', this.itemNameTraduction('ORDERS.PENALTY') + error.reason, '', this.btnAcceptLbl, false);
                            } else {
                                this._loading = false;
                            }
                        });
                    }, 1500);
                } else {
                    this._showTableIsNotActiveError = true;
                }
            } else {
                this._showError = true;
                this._showAlphanumericCodeCard = true;
                this._showOrderList = false;
                this._showNewOrderButton = false;
            }
        }
    }

    /**
     * This function allow user create new order
     */
    createNewOrder(_event?: any): void {
        this._showOrderCreation = true;
        this._showOrderList = false;
        this._showNewOrderButton = false;
    }

    /**
     * Function to validate if order creation finish
     * @param {any} _event 
     */
    validateFinishOrderCreation(_event: any): void {
        if (_event) {
            this._showOrderCreation = false;
            this._showOrderList = true;
            this._showNewOrderButton = true;
        } else {
            this._showOrderCreation = true;
            this._showOrderList = false;
            this._showNewOrderButton = false;
        }
    }

    /**
     * Validate user status
     */
    validateUser(): void {
        let _user: UserDetail = UserDetails.findOne({ user_id: this._user });
        if (_user) {
            if (_user.current_establishment === '' && _user.current_table === '') {
                this._showAlphanumericCodeCard = true;
                this._showOrderList = false;
                this._showNewOrderButton = false;
            }
        }
    }

    /**
     * Function hide message error
     */
    hideMessageError() {
        this._showError = false;
        this._showTableIsNotActiveError = false;
    }

    /**
     * Function to cancel operation
     */
    cancel(): void {
        this._ordersForm.reset();
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
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}
