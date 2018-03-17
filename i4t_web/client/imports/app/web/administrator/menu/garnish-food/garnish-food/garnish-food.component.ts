import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { GarnishFoodCol } from '../../../../../../../../both/collections/menu/garnish-food.collection';
import { GarnishFood, GarnishFoodPrice, GarnishFoodEstablishment } from '../../../../../../../../both/models/menu/garnish-food.model';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { GarnishFoodEditComponent } from '../garnish-food-edit/garnish-food-edit.component';
import { Country } from '../../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../../both/collections/general/country.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';
import { UserDetails } from '../../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../../both/models/auth/user-detail.model';

@Component({
    selector: 'garnish-food',
    templateUrl: './garnish-food.component.html',
    styleUrls: ['./garnish-food.component.scss']
})
export class GarnishFoodComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _garnishFoodForm: FormGroup;
    private _currenciesFormGroup: FormGroup = new FormGroup({});
    private _taxesFormGroup: FormGroup = new FormGroup({});
    private _mdDialogRef: MatDialogRef<any>;

    private _garnishFoodCol: Observable<GarnishFood[]>;
    private _currencies: Observable<Currency[]>;
    private _establishments: Observable<Establishment[]>;
    private _userDetails: Observable<UserDetail[]>;

    private _garnishFoodSub: Subscription;
    private _establishmentsSub: Subscription;
    private _currenciesSub: Subscription;
    private _countriesSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    public _dialogRef: MatDialogRef<any>;
    private titleMsg: string;
    private btnCancelLbl: string;
    private btnAcceptLbl: string;
    private _establishmentCurrencies: string[] = [];
    private _showCurrencies: boolean = false;
    private _establishmentTaxes: string[] = [];
    private _showTaxes: boolean = false;
    private _thereAreEstablishments: boolean = true;
    private _lEstablishmentsId: string[] = [];
    private _usersCount: number;

    /**
     * GarnishFoodComponent constructor
     * @param {MatDialog} _dialog
     * @param {MatSnackBar} snackBar
     * @param {TranslateService} _translate
     * @param {FormBuilder} _formBuilder
     * @param {NgZone} _ngZone
     * @param {Router} _router
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(public _dialog: MatDialog,
        public snackBar: MatSnackBar,
        private _translate: TranslateService,
        private _formBuilder: FormBuilder,
        private _ngZone: NgZone,
        private _router: Router,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
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
        this._garnishFoodForm = new FormGroup({
            name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]),
            currencies: this._currenciesFormGroup,
            taxes: this._taxesFormGroup
        });

        this._establishmentsSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({}).zone();
                Establishments.collection.find({}).fetch().forEach((establishment: Establishment) => {
                    this._lEstablishmentsId.push(establishment._id);
                });
                this.countEstablishments();
                this._establishments.subscribe(() => { this.buildControls(); this.countEstablishments(); });
            });
        });

        this._garnishFoodSub = MeteorObservable.subscribe('garnishFood', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._garnishFoodCol = GarnishFoodCol.find({}).zone();
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
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Function to build form controls
     */
    buildControls(): void {
        let _lEstablishmentsId: string[] = [];
        this._establishmentCurrencies = [];
        this._establishmentTaxes = [];

        if (this._currenciesSub) { this._currenciesSub.unsubscribe(); }
        if (this._countriesSub) { this._countriesSub.unsubscribe(); }

        Establishments.collection.find({}).fetch().forEach((res) => {
            _lEstablishmentsId.push(res._id);
        });
        this._countriesSub = MeteorObservable.subscribe('getCountriesByEstablishmentsId', _lEstablishmentsId).takeUntil(this._ngUnsubscribe).subscribe();
        this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', _lEstablishmentsId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                Establishments.collection.find({}).fetch().forEach((establishment) => {
                    let _lCountry: Country = Countries.findOne({ _id: establishment.countryId });
                    if (this._establishmentCurrencies.indexOf(establishment.currencyId) <= -1) {
                        let _lCurrency: Currency = Currencies.findOne({ _id: establishment.currencyId });
                        let _initValue: string = '';
                        if (_lCurrency.decimal !== 0) {
                            for (let i = 0; i < (_lCurrency.decimal).toString().slice((_lCurrency.decimal.toString().indexOf('.')), (_lCurrency.decimal.toString().length)).length - 1; i++) {
                                _initValue += '0';
                            }
                            _initValue = '0.' + _initValue;
                        } else {
                            _initValue = '0';
                        }
                        let control: FormControl = new FormControl(_initValue, [Validators.required]);
                        this._currenciesFormGroup.addControl(establishment.currencyId, control);
                        this._establishmentCurrencies.push(establishment.currencyId);

                        if (_lCountry.itemsWithDifferentTax === true) {
                            let control: FormControl = new FormControl('0', [Validators.required]);
                            this._taxesFormGroup.addControl(establishment.currencyId, control);
                            this._establishmentTaxes.push(establishment.currencyId);
                        }
                    }
                });
                this._establishmentCurrencies.length > 0 ? this._showCurrencies = true : this._showCurrencies = false;
                this._establishmentTaxes.length > 0 ? this._showTaxes = true : this._showTaxes = false;
                this._currencies = Currencies.find({}).zone();
            });
        });
    }

    /**
     * Function to add Garnish Food
     */
    addGarnishFood(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        let arrCur: any[] = Object.keys(this._garnishFoodForm.value.currencies);
        let _lGarnishFoodEstablishmentsToInsert: GarnishFoodEstablishment[] = [];
        let _lGarnishFoodPricesToInsert: GarnishFoodPrice[] = [];

        arrCur.forEach((cur) => {
            let find: Establishment[] = Establishments.collection.find({}).fetch().filter(r => r.currencyId === cur);
            for (let res of find) {
                let _lGarnishFoodEstablishment: GarnishFoodEstablishment = { establishment_id: '', price: 0 };
                _lGarnishFoodEstablishment.establishment_id = res._id;
                _lGarnishFoodEstablishment.price = this._garnishFoodForm.value.currencies[cur];

                if (this._garnishFoodForm.value.taxes[cur] !== undefined) {
                    _lGarnishFoodEstablishment.garnishFoodTax = this._garnishFoodForm.value.taxes[cur];
                }

                _lGarnishFoodEstablishmentsToInsert.push(_lGarnishFoodEstablishment);
            }
            if (cur !== null && this._garnishFoodForm.value.currencies[cur] !== null) {
                let _lGarnishFoodPrice: GarnishFoodPrice = { currencyId: '', price: 0 };
                _lGarnishFoodPrice.currencyId = cur;
                _lGarnishFoodPrice.price = this._garnishFoodForm.value.currencies[cur];
                if (this._garnishFoodForm.value.taxes[cur] !== undefined) {
                    _lGarnishFoodPrice.garnishFoodTax = this._garnishFoodForm.value.taxes[cur];
                }
                _lGarnishFoodPricesToInsert.push(_lGarnishFoodPrice);
            }
        });

        let _lNewGarnishFood = GarnishFoodCol.collection.insert({
            creation_user: this._user,
            creation_date: new Date(),
            modification_user: '-',
            modification_date: new Date(),
            is_active: true,
            name: this._garnishFoodForm.value.name,
            establishments: _lGarnishFoodEstablishmentsToInsert,
            prices: _lGarnishFoodPricesToInsert
        });

        if (_lNewGarnishFood) {
            let _lMessage: string = this.itemNameTraduction('GARNISHFOOD.GARNISH_FOOD_CREATED');
            this.snackBar.open(_lMessage, '', {
                duration: 2500
            });
        }

        this.cancel();
    }

    /**
     * Function to update Garnish Food status
     * @param {GarnishFood} _garnishFood
     */
    updateStatus(_garnishFood: GarnishFood): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        GarnishFoodCol.update(_garnishFood._id, {
            $set: {
                is_active: !_garnishFood.is_active,
                modification_date: new Date(),
                modification_user: this._user
            }
        });
    }

    /**
    * Show confirm dialog to remove the GarnishFood
    * @param {GarnishFood} _pGarnishFood
    */
    confirmRemove(_pGarnishFood: GarnishFood) {
        let dialogTitle = "GARNISHFOOD.REMOVE_TITLE";
        let dialogContent = "ADDITIONS.REMOVE_MSG";
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
                this.removeGarsnihFood(_pGarnishFood);
            }
        });
    }

    /**
     * Function to allow remove GarnishFood
     * @param {GarnishFood} _pGarnishFood
     */
    removeGarsnihFood(_pGarnishFood: GarnishFood): void {
        let _lMessage: string;
        GarnishFoodCol.remove(_pGarnishFood._id);
        _lMessage = this.itemNameTraduction('GARNISHFOOD.SUBCATEGORY_REMOVED');
        this.snackBar.open(_lMessage, '', {
            duration: 2500
        });
    }

    /**
     * Function to cancel add Garnish Food
     */
    cancel(): void {
        this._garnishFoodForm.reset();
        this._establishmentCurrencies.length > 0 ? this._showCurrencies = true : this._showCurrencies = false;
        this._currenciesFormGroup.reset();
        this._taxesFormGroup.reset();
        this._establishmentTaxes.length > 0 ? this._showTaxes = true : this._showTaxes = false;
    }

    /**
     * When user wants edit Garnish Food, this function open dialog with Garnish Food information
     * @param {GarnishFood} _garnishFood
     */
    open(_garnishFood: GarnishFood) {
        this._dialogRef = this._dialog.open(GarnishFoodEditComponent, {
            disableClose: true,
            width: '50%'
        });
        this._dialogRef.componentInstance._garnishFoodToEdit = _garnishFood;
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = null;
        });
    }

    /**
     * Function to show Garnish Food Prices
     * @param {GarnishFoodPrice[]} _pGarnishFoodPrices
     */
    showGarnishFoodPrices(_pGarnishFoodPrices: GarnishFoodPrice[]): string {
        let _lPrices: string = '';
        _pGarnishFoodPrices.forEach((g) => {
            let _lCurrency: Currency = Currencies.findOne({ _id: g.currencyId });
            if (_lCurrency) {
                let price: string = g.price + ' ' + _lCurrency.code + ' / '
                _lPrices += price;
            }
        });
        return _lPrices;
    }

    /**
     * Function to show Garnish Food Taxes
     * @param {GarnishFoodPrice[]} _pGarnishFoodPrices
     */
    showGarnishFoodTaxes(_pGarnishFoodPrices: GarnishFoodPrice[]): string {
        let _lPrices: string = '';
        _pGarnishFoodPrices.forEach((g) => {
            if (g.garnishFoodTax) {
                let _lCurrency: Currency = Currencies.findOne({ _id: g.currencyId });
                if (_lCurrency) {
                    let price: string = g.garnishFoodTax + ' ' + _lCurrency.code + ' / '
                    _lPrices += price;
                }
            }
        });
        return _lPrices;
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