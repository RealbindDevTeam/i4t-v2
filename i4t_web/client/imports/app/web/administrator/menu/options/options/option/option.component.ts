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
import { Option } from '../../../../../../../../../both/models/menu/option.model';
import { Options } from '../../../../../../../../../both/collections/menu/option.collection';
import { Establishment } from '../../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../../both/collections/establishment/establishment.collection';
import { AlertConfirmComponent } from '../../../../../general/alert-confirm/alert-confirm.component';
import { OptionEditComponent } from '../option-edit/option-edit.component';

@Component({
    selector: 'option-component',
    templateUrl: './option.component.html',
    styleUrls: ['./option.component.scss']
})
export class OptionsComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _optionForm: FormGroup;
    private _establishmentsFormGroup: FormGroup = new FormGroup({});
    private _matDialogRef: MatDialogRef<any>;

    private _optionSub: Subscription;
    private _establishmentSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _options: Observable<Option[]>;
    private _establishments: Observable<Establishment[]>;

    private _thereAreEstablishments: boolean = true;
    private _showEstablishments: boolean = true;
    private _titleMsg: string;
    private _btnAcceptLbl: string;
    private _btnCancelLbl: string;

    /**
     * OptionsComponent constructor
     * @param {MatSnackBar} _snackBar 
     * @param {MatDialog} _dialog 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {Router} _router 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(public _snackBar: MatSnackBar,
        public _dialog: MatDialog,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        private _router: Router,
        private _userLanguageService: UserLanguageService) {
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
        this._optionForm = new FormGroup({
            name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(30)]),
            establishments: this._establishmentsFormGroup
        });

        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ creation_user: this._user }).zone();
                this.countEstablishments();
                this._establishments.subscribe(() => { this.createEstablishmentsForm(), this.countEstablishments(); });
            });
        });

        this._optionSub = MeteorObservable.subscribe('getAdminOptions', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._options = Options.find({ creation_user: this._user }).zone();
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
     * Validate if establishments exists
     */
    countEstablishments(): void {
        Establishments.collection.find({ creation_user: this._user }).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * Create establishments controls in form
     */
    createEstablishmentsForm(): void {
        Establishments.collection.find({ creation_user: this._user }).fetch().forEach((res) => {
            if (this._establishmentsFormGroup.contains(res._id)) {
                this._establishmentsFormGroup.controls[res._id].setValue(false);
            } else {
                let control: FormControl = new FormControl(false);
                this._establishmentsFormGroup.addControl(res._id, control);
            }
        });

        if (Establishments.collection.find({}).count() === 0) {
            this._showEstablishments = false;
        }
    }

    /**
     * Function to add new option
     */
    addOption(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this._titleMsg, '', error, '', this._btnAcceptLbl, false);
            return;
        }

        if (this._optionForm.valid) {
            let _create_establishments: string[] = [];
            let arr: any[] = Object.keys(this._optionForm.value.establishments);

            arr.forEach((est) => {
                if (this._optionForm.value.establishments[est]) {
                    _create_establishments.push(est);
                }
            });

            let _lNewOption = Options.collection.insert({
                creation_user: this._user,
                creation_date: new Date(),
                modification_user: '-',
                modification_date: new Date(),
                establishments: _create_establishments,
                is_active: true,
                name: this._optionForm.value.name
            });

            if (_lNewOption) {
                let _lMessage: string = this.itemNameTraduction('OPTIONS.OPCION_CREATED');
                this._snackBar.open(_lMessage, '', { duration: 2500 });
            }
            this.cancel();
        }
    }

    /**
     * Function to update option status
     * @param {Option} _option 
     */
    updateStatus(_option: Option): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this._titleMsg, '', error, '', this._btnAcceptLbl, false);
            return;
        }

        Options.update({ _id: _option._id }, {
            $set: {
                is_active: !_option.is_active,
                modification_date: new Date(),
                modification_user: this._user
            }
        });
    }

    /**
     * Function to cancel add option
     */
    cancel(): void {
        this._optionForm.reset();
    }

    /**
     * When user wants edit option, this function open dialog with option information
     * @param {Option} _option
     */
    open(_option: Option) {
        this._matDialogRef = this._dialog.open(OptionEditComponent, {
            disableClose: true,
            width: '50%'
        });
        this._matDialogRef.componentInstance._optionToEdit = _option;
        this._matDialogRef.afterClosed().subscribe(result => {
            this._matDialogRef = null;
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
     * Go to add new establishments
     */
    goToAddEstablishment() {
        this._router.navigate(['/app/establishment-register']);
    }

    /**
     * Show confirm dialog to remove option
     * @param _pOption 
     */
    confirmRemove(_pOption: Option) {
        let dialogTitle = "OPTIONS.REMOVE_TITLE";
        let dialogContent = "OPTIONS.REMOVE_MSG";
        let error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';

        if (!Meteor.userId()) {
            this.openDialog(this._titleMsg, '', error, '', this._btnAcceptLbl, false);
            return;
        }
        this._matDialogRef = this._dialog.open(AlertConfirmComponent, {
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
                this.removeSection(_pOption);
            }
        });
    }

    /**
     * Function to allow remove options
     * @param {Option} _pOption
     */
    removeSection(_pOption: Option): void {
        let _lMessage: string;
        if (!this.searchValueByOption(_pOption._id)) {
            Options.remove(_pOption._id);
            _lMessage = this.itemNameTraduction('OPTIONS.OPTION_REMOVED');
            this._snackBar.open(_lMessage, '', { duration: 2500 });
        } else {
            _lMessage = this.itemNameTraduction('OPTIONS.OPTION_NOT_REMOVED');
            this._snackBar.open(_lMessage, '', { duration: 2500 });
            return;
        }
    }

    /**
     * Search values by option
     * @param {Option} _pOption 
     */
    searchValueByOption(_pOption: string): boolean {
        return false;
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
        this._matDialogRef = this._dialog.open(AlertConfirmComponent, {
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
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}