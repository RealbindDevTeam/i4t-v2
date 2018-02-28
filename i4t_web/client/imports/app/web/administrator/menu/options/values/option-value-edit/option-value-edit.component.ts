import { Component, OnInit, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
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

@Component({
    selector: 'option-value-edit',
    templateUrl: './option-value-edit.component.html',
    styleUrls: ['./option-value-edit.component.scss'],
    providers: [UserLanguageService]
})
export class OptionValueEditComponent implements OnInit {

    private _user = Meteor.userId();
    private _optionValueToEdit: OptionValue;
    private _editForm: FormGroup;
    private _mdDialogRef: MatDialogRef<any>;

    private _options: Observable<Option[]>;

    private _optionSection: string;
    private _titleMsg: string;
    private _btnAcceptLbl: string;

    /**
     * OptionValueEditComponent constructor
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {MatDialogRef<any>} _dialogRef 
     * @param {MatSnackBar} _snackBar 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService 
     * @param {MatDialog} _mdDialog 
     */
    constructor(private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        public _dialogRef: MatDialogRef<any>,
        public _snackBar: MatSnackBar,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this._titleMsg = 'SIGNUP.SYSTEM_MSG';
        this._btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._editForm = this._formBuilder.group({
            editId: [this._optionValueToEdit._id],
            editName: [this._optionValueToEdit.name, Validators.required],
            editIsActive: [this._optionValueToEdit.is_active],
            editOptionId: [this._optionValueToEdit.option_id]
        });
        this._optionSection = this._optionValueToEdit.option_id;
        this._options = Options.find({ creation_user: this._user }).zone();
    }

    /**
     * This function set option value in the form when the value select change
     */
    changeOption(_option): void {
        this._editForm.controls['editOptionId'].setValue(_option);
    }

    /**
     * Function to edit option value
     */
    editOptionValue(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this._titleMsg, '', error, '', this._btnAcceptLbl, false);
            return;
        }

        if (this._editForm.valid) {
            OptionValues.update({ _id: this._editForm.value.editId }, {
                $set: {
                    modification_user: this._user,
                    modification_date: new Date(),
                    name: this._editForm.value.editName,
                    is_active: this._editForm.value.editIsActive,
                    option_id: this._editForm.value.editOptionId
                }
            });
            let _lMessage: string = this.itemNameTraduction('OPTION_VALUE.OPTION_VALUE_EDITED');
            this._snackBar.open(_lMessage, '', { duration: 2500 });
        }
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
}