import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../services/general/user-language.service';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../both/models/auth/user-detail.model';
import { Table } from '../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../both/collections/establishment/table.collection';
import { AlertConfirmComponent } from '../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'table-change',
    templateUrl: './table-change.component.html',
    styleUrls: ['./table-change.component.scss']
})
export class TableChangeComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _changeTableForm: FormGroup;

    private _userDetailsSub: Subscription;
    private _tableSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _userDetails: Observable<UserDetail[]>
    private _tables: Observable<Table[]>;

    private _mdDialogRef: MatDialogRef<any>;
    private titleMsg: string;
    private btnAcceptLbl: string;

    /**
     * ChangeTableComponent Constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService
     * @param {MatDialog} _mdDialog
     * @param {Router} _router
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog,
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
        this._changeTableForm = new FormGroup({
            qrCodeDestiny: new FormControl('', [Validators.required, Validators.minLength(1)])
        });
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByUser', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetails = UserDetails.find({}).zone();
            });
        });
        this._tableSub = MeteorObservable.subscribe('getTableByCurrentTable', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
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
     * This function allow change user current table
     */
    changeUserTable(_pCurrentEstablishment: string, _pCurrentQRCodeTable: string): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._changeTableForm.valid) {
            MeteorObservable.call('changeCurrentTable', this._user, _pCurrentEstablishment, _pCurrentQRCodeTable, this._changeTableForm.value.qrCodeDestiny).subscribe(() => {
                this.openDialog(this.titleMsg, '', this.itemNameTraduction('CHANGE_TABLE.CHANGE_TABLE_OK'), '', this.btnAcceptLbl, false);
                this._router.navigate(['/app/orders']);
            }, (error) => {
                if (error.error === '200') {
                    this.openDialog(this.titleMsg, '', this.itemNameTraduction('CHANGE_TABLE.TABLE_DESTINY_NOT_EXISTS'), '', this.btnAcceptLbl, false);
                } else if (error.error === '201') {
                    this.openDialog(this.titleMsg, '', this.itemNameTraduction('CHANGE_TABLE.TABLE_DESTINY_NO_ACTIVE'), '', this.btnAcceptLbl, false);
                } else if (error.error === '202') {
                    this.openDialog(this.titleMsg, '', this.itemNameTraduction('CHANGE_TABLE.TABLE_DESTINY_NO_RESTAURANT'), '', this.btnAcceptLbl, false);
                } else if (error.error === '205') {
                    this.openDialog(this.titleMsg, '', this.itemNameTraduction('CHANGE_TABLE.WAITER_CALL_PENDING'), '', this.btnAcceptLbl, false);
                } else if (error.error === '206') {
                    this.openDialog(this.titleMsg, '', this.itemNameTraduction('CHANGE_TABLE.TABLE_DESTINY_STATUS_ERROR'), '', this.btnAcceptLbl, false);
                } else if (error.error === '207') {
                    this.openDialog(this.titleMsg, '', this.itemNameTraduction('CHANGE_TABLE.SAME_TABLE_ERROR'), '', this.btnAcceptLbl, false);
                } else {
                    this.openDialog(this.titleMsg, '', this.itemNameTraduction('CHANGE_TABLE.GENERAL_ERROR'), '', this.btnAcceptLbl, false);
                }
            });
        }
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
     * Function to cancel operation
     */
    cancel(): void {
        this._changeTableForm.reset();
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