import { Component, OnInit, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Categories } from '../../../../../../../../both/collections/menu/category.collection';
import { Category } from '../../../../../../../../both/models/menu/category.model';
import { Sections } from '../../../../../../../../both/collections/menu/section.collection';
import { Section } from '../../../../../../../../both/models/menu/section.model';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'categories-edit',
    templateUrl: './categories-edit.component.html',
    styleUrls: ['./categories-edit.component.scss'],
    providers: [UserLanguageService]
})
export class CategoriesEditComponent implements OnInit {

    private _user = Meteor.userId();
    public _categoryToEdit: Category;
    private _editForm: FormGroup;
    private _mdDialogRef: MatDialogRef<any>;

    private _categories: Observable<Category[]>;
    private _sections: Observable<Section[]>;

    private _categorySection: string;
    private titleMsg: string;
    private btnAcceptLbl: string;

    /**
     * CategoriesEditComponent constructor
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate
     * @param {MatDialogRef<any>} _dialogRef 
     * @param {MatSnackBar} snackBar
     * @param {NgZone} _ngZone
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        public _dialogRef: MatDialogRef<any>,
        public snackBar: MatSnackBar,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * Implements ngOnInit function
     */
    ngOnInit() {
        //this.removeSubscriptions();
        this._editForm = this._formBuilder.group({
            editId: [this._categoryToEdit._id],
            editName: [this._categoryToEdit.name, Validators.required],
            editIsActive: [this._categoryToEdit.is_active],
            editSection: [this._categoryToEdit.section]
        });
        this._categorySection = this._categoryToEdit.section;
        this._categories = Categories.find({}).zone();
        this._sections = Sections.find({}).zone();
    }

    /**
     * Function to edit Category
     */
    editCategory(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._editForm.valid) {
            Categories.update(this._editForm.value.editId, {
                $set: {
                    modification_user: this._user,
                    modification_date: new Date(),
                    name: this._editForm.value.editName,
                    is_active: this._editForm.value.editIsActive,
                    section: this._editForm.value.editSection
                }
            });

            let _lMessage: string = this.itemNameTraduction('CATEGORIES.CATEGORY_EDITED');
            this.snackBar.open(_lMessage, '', {
                duration: 2500
            });
        }
        this._dialogRef.close();
    }

    /**
     * This function set section value in the form when the value select change
     */
    changeSectionEdit(_section): void {
        this._editForm.controls['editSection'].setValue(_section);
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