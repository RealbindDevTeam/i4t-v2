import { Component, OnInit, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Observable } from 'rxjs';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Additions } from '../../../../../../../../both/collections/menu/addition.collection';
import { Addition, AdditionRestaurant, AdditionPrice } from '../../../../../../../../both/models/menu/addition.model';
import { Restaurant } from '../../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../../../both/collections/restaurant/restaurant.collection';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { Country } from '../../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../../both/collections/general/country.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'addition-edit',
    templateUrl: './addition-edit.component.html',
    styleUrls: ['./addition-edit.component.scss'],
    providers: [UserLanguageService]
})
export class AdditionEditComponent implements OnInit {

    private _user = Meteor.userId();
    public _additionToEdit: Addition;
    private _editForm: FormGroup;
    private _currenciesFormGroup: FormGroup = new FormGroup({});
    private _taxesFormGroup: FormGroup = new FormGroup({});
    private _mdDialogRef: MatDialogRef<any>;

    private _additions: Observable<Addition[]>;
    private _currencies: Observable<Currency[]>;
    private _restaurants: Observable<Restaurant[]>;

    private titleMsg: string;
    private btnAcceptLbl: string;
    private _restaurantCurrencies: string[] = [];
    private _showCurrencies: boolean = false;
    private _restaurantTaxes: string[] = [];
    private _showTaxes: boolean = false;

    /**
     * AdditionEditComponent constructor
     * @param {FormBuilder} _formBuilder
     * @param {TranslateService} _translate
     * @param {MatDialogRef<any>} _dialogRef
     * @param {NgZone} _ngZone
     * @param {MatSnackBar} snackBar
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        public _dialogRef: MatDialogRef<any>,
        private _ngZone: NgZone,
        public snackBar: MatSnackBar,
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
        this._editForm = this._formBuilder.group({
            editId: [this._additionToEdit._id],
            editName: [this._additionToEdit.name, Validators.required],
            editIsActive: [this._additionToEdit.is_active],
            editCurrencies: this._currenciesFormGroup,
            editTaxes: this._taxesFormGroup
        });
        this._additions = Additions.find({}).zone();
        this._restaurants = Restaurants.find({}).zone();
        this._restaurants.subscribe(() => { this.buildControls(); });
    }

    /**
     * Function to build form controls
     */
    buildControls(): void {
        this._restaurantCurrencies = [];
        this._restaurantTaxes = [];

        if (this._additionToEdit.prices.length > 0) {
            this._showCurrencies = true;
            this._additionToEdit.prices.forEach((p) => {
                if (this._currenciesFormGroup.contains(p.currencyId)) {
                    this._currenciesFormGroup.controls[p.currencyId].setValue(p.price);
                } else {
                    let control: FormControl = new FormControl(p.price, [Validators.required]);
                    this._currenciesFormGroup.addControl(p.currencyId, control);
                }
                this._restaurantCurrencies.push(p.currencyId);

                if (p.additionTax !== undefined) {
                    this._showTaxes = true;
                    if (this._taxesFormGroup.contains(p.currencyId)) {
                        this._taxesFormGroup.controls[p.currencyId].setValue(p.additionTax);
                    } else {
                        let controlTax: FormControl = new FormControl(p.additionTax, [Validators.required]);
                        this._taxesFormGroup.addControl(p.currencyId, controlTax);
                    }
                    this._restaurantTaxes.push(p.currencyId);
                }
            });
        }

        Restaurants.collection.find({}).fetch().forEach((restaurant) => {
            let _lCountry: Country = Countries.findOne({ _id: restaurant.countryId });
            if (this._restaurantCurrencies.indexOf(restaurant.currencyId) <= -1) {
                let _lCurrency: Currency = Currencies.findOne({ _id: restaurant.currencyId });
                let _initValue: string = '';
                if (_lCurrency.decimal !== 0) {
                    for (let i = 0; i < (_lCurrency.decimal).toString().slice((_lCurrency.decimal.toString().indexOf('.')), (_lCurrency.decimal.toString().length)).length - 1; i++) {
                        _initValue += '0';
                    }
                    _initValue = '0.' + _initValue;
                } else {
                    _initValue = '0';
                }
                if (this._currenciesFormGroup.contains(restaurant.currencyId)) {
                    this._currenciesFormGroup.controls[restaurant.currencyId].setValue(_initValue);
                } else {
                    let control: FormControl = new FormControl(_initValue, [Validators.required]);
                    this._currenciesFormGroup.addControl(restaurant.currencyId, control);
                }
                this._restaurantCurrencies.push(restaurant.currencyId);

                if (_lCountry.itemsWithDifferentTax === true) {
                    if (this._taxesFormGroup.contains(restaurant.currencyId)) {
                        this._taxesFormGroup.controls[restaurant.currencyId].setValue('');
                    } else {
                        let control: FormControl = new FormControl('0', [Validators.required]);
                        this._taxesFormGroup.addControl(restaurant.currencyId, control);
                    }
                    this._restaurantTaxes.push(restaurant.currencyId);
                }
            }
        });
        this._restaurantCurrencies.length > 0 ? this._showCurrencies = true : this._showCurrencies = false;
        this._restaurantTaxes.length > 0 ? this._showTaxes = true : this._showTaxes = false;
        this._currencies = Currencies.find({}).zone();
    }

    /**
     * Function to edit Addition
     */
    editAddition(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._editForm.valid) {
            let arrCur: any[] = Object.keys(this._editForm.value.editCurrencies);
            let _lAdditionRestaurantsToInsert: AdditionRestaurant[] = [];
            let _lAdditionPricesToInsert: AdditionPrice[] = [];

            arrCur.forEach((cur) => {
                let find: Restaurant[] = Restaurants.collection.find({}).fetch().filter(r => r.currencyId === cur);
                for (let res of find) {
                    let _lAdditionRestaurant: AdditionRestaurant = { restaurantId: '', price: 0 };
                    _lAdditionRestaurant.restaurantId = res._id;
                    _lAdditionRestaurant.price = this._editForm.value.editCurrencies[cur];

                    if (this._editForm.value.editTaxes[cur] !== undefined) {
                        _lAdditionRestaurant.additionTax = this._editForm.value.editTaxes[cur];
                    }

                    _lAdditionRestaurantsToInsert.push(_lAdditionRestaurant);
                }
                let _lAdditionPrice: AdditionPrice = { currencyId: '', price: 0 };
                _lAdditionPrice.currencyId = cur;
                _lAdditionPrice.price = this._editForm.value.editCurrencies[cur];
                if (this._editForm.value.editTaxes[cur] !== undefined) {
                    _lAdditionPrice.additionTax = this._editForm.value.editTaxes[cur];
                }
                _lAdditionPricesToInsert.push(_lAdditionPrice);
            });

            Additions.update(this._editForm.value.editId, {
                $set: {
                    modification_user: this._user,
                    modification_date: new Date(),
                    name: this._editForm.value.editName,
                    is_active: this._editForm.value.editIsActive,
                    restaurants: _lAdditionRestaurantsToInsert,
                    prices: _lAdditionPricesToInsert
                }
            });

            let _lMessage: string = this.itemNameTraduction('ADDITIONS.ADDITION_EDITED');
            this.snackBar.open(_lMessage, '', {
                duration: 2500
            });

            this._dialogRef.close();
        }
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