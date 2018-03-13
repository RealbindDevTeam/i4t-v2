import { Component, OnInit, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../../services/general/user-language.service';
import { Option } from '../../../../../../../../../both/models/menu/option.model';
import { Options } from '../../../../../../../../../both/collections/menu/option.collection';
import { Establishment } from '../../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../../both/collections/establishment/establishment.collection';
import { AlertConfirmComponent } from '../../../../../general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'option-edit',
    templateUrl: './option-edit.component.html',
    styleUrls: ['./option-edit.component.scss'],
    providers: [UserLanguageService]
})
export class OptionEditComponent implements OnInit {

    private _user = Meteor.userId();
    private _optionToEdit: Option;
    private _editForm: FormGroup;
    private _establishmentsFormGroup: FormGroup = new FormGroup({});
    private _matDialogRef: MatDialogRef<any>;

    private _options: Observable<Option[]>;
    private _establishments: Observable<Establishment[]>;

    private _optionEstablishments: string[] = [];
    private titleMsg: string;
    private btnAcceptLbl: string;

    /**
     * OptionEditComponent constructor
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {MatDialogRef<any>} _dialogRef 
     * @param {NgZone} _ngZone 
     * @param {MatSnackBar} _snackBar 
     * @param {UserLanguageService} _userLanguageService 
     * @param {MatDialog} _matDialog 
     */
    constructor(private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        public _dialogRef: MatDialogRef<any>,
        private _ngZone: NgZone,
        public _snackBar: MatSnackBar,
        private _userLanguageService: UserLanguageService,
        protected _matDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._editForm = this._formBuilder.group({
            editId: [this._optionToEdit._id],
            editName: [this._optionToEdit.name, Validators.required],
            editIsActive: [this._optionToEdit.is_active],
            editEstablishments: this._establishmentsFormGroup
        });
        this._optionEstablishments = this._optionToEdit.establishments;
        this._options = Options.find({ creation_user: this._user }).zone();
        this._establishments = Establishments.find({ creation_user: this._user }).zone();
        this._establishments.subscribe(() => { this.createEstablishmentForm(); });
    }

    /**
     * Create establishments controls in form
     */
    createEstablishmentForm(): void {
        Establishments.collection.find({}).fetch().forEach((res) => {
            let find = this._optionEstablishments.filter(r => r == res._id);
            if (find.length > 0) {
                let control: FormControl = new FormControl(true);
                this._establishmentsFormGroup.addControl(res._id, control);
            } else {
                let control: FormControl = new FormControl(false);
                this._establishmentsFormGroup.addControl(res._id, control);
            }
        });
    }

    /**
     * Function to edit Option
     */
    editOption(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._editForm.valid) {
            let _edition_establishments: string[] = [];
            let arr: any[] = Object.keys(this._editForm.value.editEstablishments);

            arr.forEach((est) => {
                if (this._editForm.value.editEstablishments[est]) {
                    _edition_establishments.push(est);
                }
            });

            Options.update({ _id: this._editForm.value.editId }, {
                $set: {
                    modification_user: this._user,
                    modification_date: new Date(),
                    name: this._editForm.value.editName,
                    is_active: this._editForm.value.editIsActive,
                    establishments: _edition_establishments
                }
            });

            let _lMessage: string = this.itemNameTraduction('OPTIONS.OPTION_EDITED');
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
}