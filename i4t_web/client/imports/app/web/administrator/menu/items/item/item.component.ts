import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MatDialogRef, MatDialog, MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Item, ItemPrice } from '../../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../../both/collections/menu/item.collection';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { AlertConfirmComponent } from '../../../../general/alert-confirm/alert-confirm.component';
import { UserDetails } from '../../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../../both/models/auth/user-detail.model';
import { Recommended } from "./recommended/recommended.component";

@Component({
    selector: 'item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss']
})
export class ItemComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _itemsSub: Subscription;
    private _currenciesSub: Subscription;
    private _establishmentSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _items: Observable<Item[]>;
    private _establishments: Observable<Establishment[]>;
    private _userDetails: Observable<UserDetail[]>;

    public _dialogRef: MatDialogRef<any>;
    private titleMsg: string;
    private btnCancelLbl: string;
    private btnAcceptLbl: string;
    private _thereAreEstablishments: boolean = true;
    private _thereAreItems: boolean = true;
    private _lEstablishmentsId: string[] = [];
    private _usersCount: number;

    /**
     * ItemComponent contructor
     * @param {Router} _router
     * @param {FormBuilder} _formBuilder
     * @param {TranslateService} _translate
     * @param {NgZone} _ngZone
     * @param {MatDialog} _dialog
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _router: Router,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        public _dialog: MatDialog,
        public snackBar: MatSnackBar,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnCancelLbl = 'CANCEL';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * Implements ngOnInit function
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._itemsSub = MeteorObservable.subscribe('items', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
                this.countItems();
                this._items.subscribe(() => { this.countItems(); });
            });
        });
        this._currenciesSub = MeteorObservable.subscribe('currencies').takeUntil(this._ngUnsubscribe).subscribe();
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
    }

    /**
     * Validate if establishments exists
     */
    countEstablishments(): void {
        Establishments.collection.find({}).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * Validate if items exists
     */
    countItems(): void {
        Items.collection.find({}).count() > 0 ? this._thereAreItems = true : this._thereAreItems = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * This function open item creation wizard
     */
    openItemCreation(): void {
        this._router.navigate(['app/items-creation']);
    }

    /**
     * When user wants edit item, this function open dialog with Item information
     * @param {Item} _item
     */
    open(_item: Item) {
        this._router.navigate(['app/items-edition', JSON.stringify(_item)], { skipLocationChange: true });
    }

    /**
     * Function to update Item updateStatus
     * @param {Item} _item
     */
    updateStatus(_item: Item): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        Items.update(_item._id, {
            $set: {
                is_active: !_item.is_active,
                modification_date: new Date(),
                modification_user: Meteor.userId()
            }
        });
    }

    /**
     * Show Recommended dialog
     * @param _pItem 
     */
    openRecommendDialog(_pItem: Item) {
        this._dialogRef = this._dialog.open(Recommended, {
            disableClose: true,
            data: {
                item: _pItem
            }
        });
    }

    /**
    * Show confirm dialog to remove the Item
    * @param {Item} _pItem
    */
    confirmRemove(_pItem: Item) {
        let dialogTitle = "ITEMS.REMOVE_TITLE";
        let dialogContent = "ITEMS.REMOVE_MSG";
        let error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';

        if (!Meteor.userId()) {
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }
        this._dialogRef = this._dialog.open(AlertConfirmComponent, {
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
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = result;
            if (result.success) {
                this.removeItem(_pItem);
            }
        });
    }

    /**
     * Function to allow remove Item
     * @param {Item} _pItem
     */
    removeItem(_pItem: Item): void {
        let _lMessage: string;
        Items.remove(_pItem._id);
        _lMessage = this.itemNameTraduction('ITEMS.ITEM_REMOVED');
        this.snackBar.open(_lMessage, '', {
            duration: 2500
        });
    }

    /**
     * Function to show Item Prices
     * @param {ItemPrice} _pItemPrices
     */
    showItemPrices(_pItemPrices: ItemPrice[]): string {
        let _lPrices: string = '';
        _pItemPrices.forEach((ip) => {
            let _lCurrency: Currency = Currencies.findOne({ _id: ip.currencyId });
            if (_lCurrency) {
                let price: string = ip.price + ' ' + _lCurrency.code + ' / '
                _lPrices += price;
            }
        });
        return _lPrices;
    }

    /**
     * Function to show Item Taxes
     * @param {ItemPrice[]} _pItemPrices
     */
    showItemTaxes(_pItemPrices: ItemPrice[]): string {
        let _lTaxes: string = '';
        _pItemPrices.forEach((ip) => {
            if (ip.itemTax) {
                let _lCurrency: Currency = Currencies.findOne({ _id: ip.currencyId });
                if (_lCurrency) {
                    let tax: string = ip.itemTax + ' ' + _lCurrency.code + ' / '
                    _lTaxes += tax;
                }
            }
        });
        return _lTaxes;
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

        this._dialogRef = this._dialog.open(AlertConfirmComponent, {
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
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialog = result;
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
     * Implements ngOnDestroy function
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}