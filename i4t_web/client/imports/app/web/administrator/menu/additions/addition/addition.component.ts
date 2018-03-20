import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MatDialogRef, MatDialog } from '@angular/material';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Additions } from '../../../../../../../../both/collections/menu/addition.collection';
import { Addition, AdditionEstablishment, AdditionPrice } from '../../../../../../../../both/models/menu/addition.model';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { AdditionEditComponent } from '../addition-edit/addition-edit.component';
import { Country } from '../../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../../both/collections/general/country.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';
import { UserDetails } from '../../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../../both/models/auth/user-detail.model';

@Component({
    selector: 'addition',
    templateUrl: './addition.component.html',
    styleUrls: ['./addition.component.scss']
})
export class AdditionComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _additionForm: FormGroup;
    private _currenciesFormGroup: FormGroup = new FormGroup({});
    private _taxesFormGroup: FormGroup = new FormGroup({});
    private _mdDialogRef: MatDialogRef<any>;

    private _additions: Observable<Addition[]>;
    private _currencies: Observable<Currency[]>;
    private _estalishments: Observable<Establishment[]>;
    private _userDetails: Observable<UserDetail[]>;

    private _additionsSub: Subscription;
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
     * AdditionComponent constructor
     * @param {MatDialog} _dialog
     * @param {MatSnackBar} snackBar
     * @param {FormBuilder} _formBuilder
     * @param {TranslateService} _translate
     * @param {NgZone} _ngZone
     * @param {Router} _router
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(public _dialog: MatDialog,
        public snackBar: MatSnackBar,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
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
        this._additionForm = new FormGroup({
            name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(30)]),
            currencies: this._currenciesFormGroup,
            taxes: this._taxesFormGroup
        });

        this._establishmentsSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._estalishments = Establishments.find({}).zone();
                Establishments.collection.find({}).fetch().forEach((establishment: Establishment) => {
                    this._lEstablishmentsId.push(establishment._id);
                });
                this.countEstablishments();
                this._estalishments.subscribe(() => { this.buildControls(); this.countEstablishments(); });
            });
        });

        this._additionsSub = MeteorObservable.subscribe('additions', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._additions = Additions.find({}).zone();
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
     * Function to add Addition
     */
    addAddition(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        let arrCur: any[] = Object.keys(this._additionForm.value.currencies);
        let _lAdditionEstablishmentsToInsert: AdditionEstablishment[] = [];
        let _lAdditionPricesToInsert: AdditionPrice[] = [];

        arrCur.forEach((cur) => {
            let find: Establishment[] = Establishments.collection.find({}).fetch().filter(r => r.currencyId === cur);
            for (let res of find) {
                let _lAdditionEstablishment: AdditionEstablishment = { establishment_id: '', price: 0 };
                _lAdditionEstablishment.establishment_id = res._id;
                _lAdditionEstablishment.price = this._additionForm.value.currencies[cur];

                if (this._additionForm.value.taxes[cur] !== undefined) {
                    _lAdditionEstablishment.additionTax = this._additionForm.value.taxes[cur];
                }

                _lAdditionEstablishmentsToInsert.push(_lAdditionEstablishment);
            }
            if (cur !== null && this._additionForm.value.currencies[cur] !== null) {
                let _lAdditionPrice: AdditionPrice = { currencyId: '', price: 0 };
                _lAdditionPrice.currencyId = cur;
                _lAdditionPrice.price = this._additionForm.value.currencies[cur];
                if (this._additionForm.value.taxes[cur] !== undefined) {
                    _lAdditionPrice.additionTax = this._additionForm.value.taxes[cur];
                }
                _lAdditionPricesToInsert.push(_lAdditionPrice);
            }
        });

        let _lNewAddition = Additions.collection.insert({
            creation_user: this._user,
            creation_date: new Date(),
            modification_user: '-',
            modification_date: new Date(),
            is_active: true,
            name: this._additionForm.value.name,
            establishments: _lAdditionEstablishmentsToInsert,
            prices: _lAdditionPricesToInsert
        });

        if (_lNewAddition) {
            let _lMessage: string = this.itemNameTraduction('ADDITIONS.ADDITION_CREATED');
            this.snackBar.open(_lMessage, '', {
                duration: 2500
            });
        }

        this.cancel();
    }

    /**
     * Function to update Addition status
     * @param {Addition} _addition 
     */
    updateStatus(_addition: Addition): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        Additions.update(_addition._id, {
            $set: {
                is_active: !_addition.is_active,
                modification_date: new Date(),
                modification_user: this._user
            }
        });
    }

    /**
    * Show confirm dialog to remove the Addition
    * @param {Addition} _pAddition
    */
    confirmRemove(_pAddition: Addition) {
        let dialogTitle = "ADDITIONS.REMOVE_TITLE";
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
                this.removeAddition(_pAddition);
            }
        });
    }

    /**
     * Function to allow remove addition
     * @param {Addition} _pAddition
     */
    removeAddition(_pAddition: Addition): void {
        let _lMessage: string;
        Additions.remove(_pAddition._id);
        _lMessage = this.itemNameTraduction('ADDITIONS.SUBCATEGORY_REMOVED');
        this.snackBar.open(_lMessage, '', {
            duration: 2500
        });
    }

    /**
     * Function to cancel add Addition
     */
    cancel(): void {
        this._additionForm.reset();
        this._establishmentCurrencies.length > 0 ? this._showCurrencies = true : this._showCurrencies = false;
        this._currenciesFormGroup.reset();
        this._taxesFormGroup.reset();
        this._establishmentTaxes.length > 0 ? this._showTaxes = true : this._showTaxes = false;
    }

    /**
     * When user wants edit Addition, this function open dialog with Addition information
     * @param {Addition} _addition
     */
    open(_addition: Addition) {
        this._dialogRef = this._dialog.open(AdditionEditComponent, {
            disableClose: true,
            width: '50%'
        });
        this._dialogRef.componentInstance._additionToEdit = _addition;
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = null;
        });
    }

    /**
     * Function to show Addition Prices
     * @param {AdditionPrice[]} _pAdditionPrices
     */
    showAdditionPrices(_pAdditionPrices: AdditionPrice[]): string {
        let _lPrices: string = '';
        _pAdditionPrices.forEach((ap) => {
            let _lCurrency: Currency = Currencies.findOne({ _id: ap.currencyId });
            if (_lCurrency) {
                let price: string = ap.price + ' ' + _lCurrency.code + ' / '
                _lPrices += price;
            }
        });
        return _lPrices;
    }

    /**
     * Function to show Addition Taxes
     * @param {AdditionPrice[]} _pAdditionPrices
     */
    showAdditionTaxes(_pAdditionPrices: AdditionPrice[]): string {
        let _lTaxes: string = '';
        _pAdditionPrices.forEach((ap) => {
            if (ap.additionTax) {
                let _lCurrency: Currency = Currencies.findOne({ _id: ap.currencyId });
                if (_lCurrency) {
                    let tax: string = ap.additionTax + ' ' + _lCurrency.code + ' / '
                    _lTaxes += tax;
                }
            }
        });
        return _lTaxes;
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