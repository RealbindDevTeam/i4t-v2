import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { MatDialogRef, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Items } from '../../../../../../../../both/collections/menu/item.collection';
import { Subcategories } from '../../../../../../../../both/collections/menu/subcategory.collection';
import { Subcategory } from '../../../../../../../../both/models/menu/subcategory.model';
import { Categories } from '../../../../../../../../both/collections/menu/category.collection';
import { Category } from '../../../../../../../../both/models/menu/category.model';
import { SubcategoryEditComponent } from '../subcategories-edit/subcategories-edit.component';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { AlertConfirmComponent } from '../../../../general/alert-confirm/alert-confirm.component';
import { UserDetails } from '../../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../../both/models/auth/user-detail.model';

@Component({
    selector: 'subcategory',
    templateUrl: './subcategories.component.html',
    styleUrls: ['./subcategories.component.scss']
})
export class SubcategoryComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _subcategoryForm: FormGroup;
    private _mdDialogRef: MatDialogRef<any>;

    private _subcategories: Observable<Subcategory[]>;
    private _categories: Observable<Category[]>;
    private _establishments: Observable<Establishment[]>;
    private _userDetails: Observable<UserDetail[]>;

    private _subcategorySub: Subscription;
    private _categoriesSub: Subscription;
    private _establishmentSub: Subscription;
    private _itemsSubscription: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    _selectedValue: string;
    private titleMsg: string;
    private btnCancelLbl: string;
    private btnAcceptLbl: string;
    _dialogRef: MatDialogRef<any>;
    private _thereAreEstablishments: boolean = true;
    private _lEstablishmentsId: string[] = [];
    private _usersCount: number;


    /**
     * SubcategoryComponent constructor
     * @param {MatDialog} _dialog
     * @param {MatSnackBar} snackBar
     * @param {FormBuilder} _formBuilder
     * @param {TranslateService} _translate
     * @param {Router} _router
     * @param {NgZone} _ngZone
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(public _dialog: MatDialog,
        public snackBar: MatSnackBar,
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
        this._subcategoryForm = new FormGroup({
            name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]),
            category: new FormControl('')
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
        this._categoriesSub = MeteorObservable.subscribe('categories', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._categories = Categories.find({}).zone();
            });
        });
        this._subcategorySub = MeteorObservable.subscribe('subcategories', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._subcategories = Subcategories.find({}).zone();
            });
        });
        this._itemsSubscription = MeteorObservable.subscribe('items', this._user).takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Validate if establishments exists
     */
    countEstablishments(): void {
        Establishments.collection.find({}).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Function to add subcategory
     */
    addSubcategory(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._subcategoryForm.valid) {
            let _lNewSubcategory = Subcategories.collection.insert({
                creation_user: this._user,
                creation_date: new Date(),
                modification_user: '-',
                modification_date: new Date(),
                is_active: true,
                name: this._subcategoryForm.value.name,
                category: this._subcategoryForm.value.category
            });

            if (_lNewSubcategory) {
                let _lMessage: string = this.itemNameTraduction('SUBCATEGORIES.SUBCATEGORY_CREATED');
                this.snackBar.open(_lMessage, '', {
                    duration: 2500
                });
            }

            this._subcategoryForm.reset();
            this._selectedValue = "";
        }
    }

    /**
     * Show confirm dialog to remove the Subcategory
     * @param {Subcategory} _pSubcategory 
     */
    confirmRemove(_pSubcategory: Subcategory) {
        let dialogTitle = "SUBCATEGORIES.REMOVE_TITLE";
        let dialogContent = "SUBCATEGORIES.REMOVE_MSG";
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
                this.removeSubcategory(_pSubcategory);
            }
        });
    }

    /**
     * Function to allow remove subcategory
     * @param {Subcategory} _pSubcategory
     */
    removeSubcategory(_pSubcategory: Subcategory): void {
        let _lMessage: string;
        if (!this.searchItemsBySubcategory(_pSubcategory._id)) {
            Subcategories.remove(_pSubcategory._id);
            _lMessage = this.itemNameTraduction('SUBCATEGORIES.SUBCATEGORY_REMOVED');
            this.snackBar.open(_lMessage, '', {
                duration: 2500
            });
        } else {
            _lMessage = this.itemNameTraduction('SUBCATEGORIES.SUBCATEGORY_NOT_REMOVED');
            this.snackBar.open(_lMessage, '', {
                duration: 2500
            });
            return;
        }
    }

    /**
     * Search items by subcategory
     * @param {string} _pSubcategoryId 
     */
    searchItemsBySubcategory(_pSubcategoryId: string): boolean {
        let lItems = Items.collection.find({ subcategoryId: _pSubcategoryId }).count();
        if (lItems > 0) {
            return true;
        }
        return false;
    }

    /**
     * This function set category value in the form when the value select change
     */
    changeCategory(_pCategory): void {
        this._subcategoryForm.controls['category'].setValue(_pCategory);
    }

    /**
     * Function to cancel add Subcategory
     */
    cancel(): void {
        this._subcategoryForm.controls['name'].reset();
        this._selectedValue = "";
    }

    /**
     * Function to update Subcategory status
     * @param {Subcategory} _subcategory
     */
    updateStatus(_subcategory: Subcategory): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        Subcategories.update(_subcategory._id, {
            $set: {
                is_active: !_subcategory.is_active,
                modification_date: new Date(),
                modification_user: this._user
            }
        });
    }

    /**
     * When useer wants edit Subcategory, this function open dialog with Subcategory information
     * @param {Subcategory} _subcategory
     */
    open(_subcategory: Subcategory) {
        this._dialogRef = this._dialog.open(SubcategoryEditComponent, {
            disableClose: true,
            width: '50%'
        });
        this._dialogRef.componentInstance._subcategoryToEdit = _subcategory;
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = null;
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