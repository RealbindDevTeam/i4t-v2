import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { MatDialogRef, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../../services/general/user-language.service';
import { OptionValue } from '../../../../../../../../../both/models/menu/option-value.model';
import { OptionValues } from '../../../../../../../../../both/collections/menu/option-value.collection';
import { Establishment } from '../../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../../both/collections/establishment/establishment.collection';
import { Option } from '../../../../../../../../../both/models/menu/option.model';
import { Options } from '../../../../../../../../../both/collections/menu/option.collection';
import { AlertConfirmComponent } from '../../../../../../web/general/alert-confirm/alert-confirm.component';
import { OptionValueEditComponent } from '../option-value-edit/option-value-edit.component';

@Component({
    selector: 'option-value',
    templateUrl: './option-value.component.html',
    styleUrls: ['./option-value.component.scss']
})
export class OptionValueComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _optionValueForm: FormGroup;

    private _optionValuesSub: Subscription;
    private _optionsSub: Subscription;
    private _establishmentSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _optionValues: Observable<OptionValue[]>;
    private _options: Observable<Option[]>;
    private _establishments: Observable<Establishment[]>;

    private _selectedValue: string = '';
    private _thereAreEstablishments: boolean = true;
    private _matDialogRef: MatDialogRef<any>;
    private _titleMsg: string;
    private _btnAcceptLbl: string;
    private _btnCancelLbl: string;

    /**
     * OptionValueComponent constructor
     * @param {MatSnackBar} _snackBar 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {Router} _router 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService 
     * @param {MatDialog} _matDialog 
     */
    constructor(public _snackBar: MatSnackBar,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _router: Router,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        protected _matDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this._titleMsg = 'SIGNUP.SYSTEM_MSG';
        this._btnAcceptLbl = 'SIGNUP.ACCEPT';
        this._btnCancelLbl = 'CANCEL';
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._optionValueForm = new FormGroup({
            name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(30)]),
            option: new FormControl('')
        });
        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ creation_user: this._user }).zone();
                this.countEstablishments();
                this._establishments.subscribe(() => { this.countEstablishments(); });
            });
        });
        this._optionsSub = MeteorObservable.subscribe('getAdminOptions', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._options = Options.find({ creation_user: this._user }).zone();
            });
        });
        this._optionValuesSub = MeteorObservable.subscribe('getAdminOptionValues', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._optionValues = OptionValues.find({ creation_user: this._user }).zone();
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
     * Validate if establishment exists
     */
    countEstablishments(): void {
        Establishments.collection.find({ creation_user: this._user }).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * This function set option value in the form when the value select change
     */
    changeOption(_option): void {
        this._optionValueForm.controls['option'].setValue(_option);
    }

    /**
     * Function to add option value
     */
    addOptionValue(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this._titleMsg, '', error, '', this._btnAcceptLbl, false);
            return;
        }

        if (this._optionValueForm.valid) {
            let _lNewOptionValue = OptionValues.collection.insert({
                creation_user: this._user,
                creation_date: new Date(),
                modification_user: '-',
                modification_date: new Date(),
                is_active: true,
                name: this._optionValueForm.value.name,
                option_id: this._optionValueForm.value.option
            });

            if (_lNewOptionValue) {
                let _lMessage: string = this.itemNameTraduction('OPTION_VALUE.OPTION_VALUE_CREATED');
                this._snackBar.open(_lMessage, '', { duration: 2500 });
            }

            this._optionValueForm.reset();
            this._selectedValue = '';
        }
    }

    /**
     * Show confirm dialog to remove the option value
     * @param {OptionValue} _pOptionValue 
     */
    confirmRemove(_pOptionValue: OptionValue) {
        let dialogTitle = "OPTION_VALUE.REMOVE_TITLE";
        let dialogContent = "OPTION_VALUE.REMOVE_MSG";
        let error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';

        if (!Meteor.userId()) {
            this.openDialog(this._titleMsg, '', error, '', this._btnAcceptLbl, false);
            return;
        }
        this._matDialogRef = this._matDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: dialogTitle,
                subtitle: '',
                content: dialogContent,
                buttonCancel: this._btnCancelLbl,
                buttonAccept: this._btnAcceptLbl,
                showCancel: true
            }
        });
        this._matDialogRef.afterClosed().subscribe(result => {
            this._matDialogRef = result;
            if (result.success) {
                this.removeCategory(_pOptionValue);
            }
        });
    }

    /**
     * Function to allow remove option value
     * @param {OptionValue} _pOptionValue
     */
    removeCategory(_pOptionValue: OptionValue): void {
        let _lMessage: string;
        if (!this.searchItemsByOptionValue(_pOptionValue._id)) {
            OptionValues.remove(_pOptionValue._id);
            _lMessage = this.itemNameTraduction('OPTION_VALUE.OPTION_VALUE_REMOVED');
            this._snackBar.open(_lMessage, '', { duration: 2500 });
        } else {
            _lMessage = this.itemNameTraduction('OPTION_VALUE.OPTION_VALUE_NOT_REMOVED');
            this._snackBar.open(_lMessage, '', { duration: 2500 });
            return;
        }
    }

    /**
     * Search items by option value
     * @param {string} _pOptionValueId 
     */
    searchItemsByOptionValue(_pOptionValueId: string): boolean {
        return false;
    }

    /**
     * Function to update Option value status
     * @param {OptionValue} _optionValue
     */
    updateStatus(_optionValue: OptionValue): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this._titleMsg, '', error, '', this._btnAcceptLbl, false);
            return;
        }

        OptionValues.update({ _id: _optionValue._id }, {
            $set: {
                is_active: !_optionValue.is_active,
                modification_date: new Date(),
                modification_user: this._user
            }
        });
    }

    /**
     * When user wants edit Option value, this function open dialog with Option value information
     * @param {OptionValue} _pOptionValue 
     */
    open(_pOptionValue: OptionValue) {
        this._matDialogRef = this._matDialog.open(OptionValueEditComponent, {
            disableClose: true,
            width: '50%'
        });
        this._matDialogRef.componentInstance._optionValueToEdit = _pOptionValue;
        this._matDialogRef.afterClosed().subscribe(result => {
            this._matDialogRef = null;
        });
    }

    /**
     * Function to cancel add Category
     */
    cancel(): void {
        this._optionValueForm.controls['name'].reset();
        this._selectedValue = "";
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
     * Go to add new Establishment
     */
    goToAddEstablishment() {
        this._router.navigate(['/app/establishment-register']);
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

        this._matDialogRef = this._matDialog.open(AlertConfirmComponent, {
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
        this._matDialogRef.afterClosed().subscribe(result => {
            this._matDialogRef = result;
            if (result.success) {

            }
        });
    }

    /**
     * ngOnInit implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}