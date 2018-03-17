import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { MatDialogRef, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Items } from '../../../../../../../../both/collections/menu/item.collection';
import { Subcategories } from '../../../../../../../../both/collections/menu/subcategory.collection';
import { Categories } from '../../../../../../../../both/collections/menu/category.collection';
import { Category } from '../../../../../../../../both/models/menu/category.model';
import { Sections } from '../../../../../../../../both/collections/menu/section.collection';
import { Section } from '../../../../../../../../both/models/menu/section.model';
import { CategoriesEditComponent } from '../categories-edit/categories-edit.component';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';
import { UserDetails } from '../../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../../both/models/auth/user-detail.model';

@Component({
    selector: 'category',
    templateUrl: './categories.component.html',
    styleUrls: ['./categories.component.scss']
})
export class CategoryComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _categoryForm: FormGroup;
    private _categories: Observable<Category[]>;
    private _sections: Observable<Section[]>;
    private _establishments: Observable<Establishment[]>;
    private _mdDialogRef: MatDialogRef<any>;
    private _userDetails: Observable<UserDetail[]>;

    private _categoriesSub: Subscription;
    private _sectionsSub: Subscription;
    private _establishmentSub: Subscription;
    private _itemsSubscription: Subscription;
    private _subCategoriesSubscription: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _selectedValue: string;
    private titleMsg: string;
    private btnCancelLbl: string;
    private btnAcceptLbl: string;
    public _dialogRef: MatDialogRef<any>;
    private _thereAreEstablishments: boolean = true;
    private _lEstablishmentsId: string[] = [];
    private _usersCount: number;

    /**
     * CategoryComponent constructor
     * @param {MatSnackBar} snackBar
     * @param {FormBuilder} _formBuilder
     * @param {TranslateService} _translate
     * @param {MatDialog} _dialog
     * @param {Router} _router
     * @param {NgZone} _ngZone
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(public snackBar: MatSnackBar,
        public _dialog: MatDialog,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _router: Router,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this._selectedValue = "";
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnCancelLbl = 'CANCEL';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * Implements ngOnInit function
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._categoryForm = new FormGroup({
            name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]),
            section: new FormControl('')
        });
        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({}).zone();
                Establishments.collection.find({}).fetch().forEach((establishment: Establishment) => {
                    this._lEstablishmentsId.push(establishment._id);
                });
                this.countEstablishments();
                this._establishments.subscribe(() => { this.countEstablishments(); });
            });
        });
        this._sectionsSub = MeteorObservable.subscribe('sections', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._sections = Sections.find({}).zone();
            });
        });
        this._categoriesSub = MeteorObservable.subscribe('categories', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._categories = Categories.find({}).zone();
            });
        });

        this._subCategoriesSubscription = MeteorObservable.subscribe('subcategories', this._user).takeUntil(this._ngUnsubscribe).subscribe();
        this._itemsSubscription = MeteorObservable.subscribe('items', this._user).takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Validate if establishment exists
     */
    countEstablishments(): void {
        Establishments.collection.find().count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Function to add Category
     */
    addCategory(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._categoryForm.valid) {
            let _lNewCategory = Categories.collection.insert({
                creation_user: this._user,
                creation_date: new Date(),
                modification_user: '-',
                modification_date: new Date(),
                is_active: true,
                name: this._categoryForm.value.name,
                section: this._categoryForm.value.section
            });

            if (_lNewCategory) {
                let _lMessage: string = this.itemNameTraduction('CATEGORIES.CATEGORY_CREATED');
                this.snackBar.open(_lMessage, '', {
                    duration: 2500
                });
            }

            this._categoryForm.reset();
            this._selectedValue = "";
        }
    }

    /**
     * Show confirm dialog to remove the category
     * @param _pCategory 
     */
    confirmRemove(_pCategory: Category) {
        let dialogTitle = "CATEGORIES.REMOVE_TITLE";
        let dialogContent = "CATEGORIES.REMOVE_MSG";
        let error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';

        if (!Meteor.userId()) {
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }
        this._mdDialogRef = this._dialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: dialogTitle,
                subtitle: '',
                content: dialogContent,
                buttonCancel: this.btnCancelLbl,
                buttonAccept: this.btnAcceptLbl,
                showCancel: true
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                this.removeCategory(_pCategory);
            }
        });
    }

    /**
     * Function to allow remove category
     * @param {Category} _pCategory
     */
    removeCategory(_pCategory: Category): void {
        let _lMessage: string;
        if (!this.searchSubcategoriesByCategory(_pCategory._id) && !this.searchItemsByCategory(_pCategory._id)) {
            Categories.remove(_pCategory._id);
            _lMessage = this.itemNameTraduction('CATEGORIES.CATEGORY_REMOVED');
            this.snackBar.open(_lMessage, '', {
                duration: 2500
            });
        } else {
            _lMessage = this.itemNameTraduction('CATEGORIES.CATEGORY_NOT_REMOVED');
            this.snackBar.open(_lMessage, '', {
                duration: 2500
            });
            return;
        }
    }

    /**
     * Search categories by category
     * @param {string} _pCategoryId 
     */
    searchSubcategoriesByCategory(_pCategoryId: string): boolean {
        let lSubCategories = Subcategories.collection.find({ category: _pCategoryId }).count();
        if (lSubCategories > 0) {
            return true;
        }
        return false;
    }

    /**
     * Search items by category
     * @param {string} _pCategoryId 
     */
    searchItemsByCategory(_pCategoryId: string): boolean {
        let lItems = Items.collection.find({ categoryId: _pCategoryId }).count();
        if (lItems > 0) {
            return true;
        }
        return false;
    }

    /**
     * Function to cancel add Category
     */
    cancel(): void {
        this._categoryForm.controls['name'].reset();
        this._selectedValue = "";
    }

    /**
     * When user wants edit Category, this function open dialog with Category information
     * @param {Category} _category 
     */
    open(_category: Category) {
        this._dialogRef = this._dialog.open(CategoriesEditComponent, {
            disableClose: true,
            width: '50%'
        });
        this._dialogRef.componentInstance._categoryToEdit = _category;
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = null;
        });
    }

    /**
     * This function set section value in the form when the value select change
     */
    changeSection(_section): void {
        this._categoryForm.controls['section'].setValue(_section);
    }

    /**
     * Function to update Category status
     * @param {Category} _category
     */
    updateStatus(_category: Category): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        Categories.update(_category._id, {
            $set: {
                is_active: !_category.is_active,
                modification_date: new Date(),
                modification_user: this._user
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
     * Implements ngOnDestroy function
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}