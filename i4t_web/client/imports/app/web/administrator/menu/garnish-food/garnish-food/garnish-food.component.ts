import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { GarnishFoodCol } from '../../../../../../../../both/collections/menu/garnish-food.collection';
import { GarnishFood, GarnishFoodPrice, GarnishFoodRestaurant } from '../../../../../../../../both/models/menu/garnish-food.model';
import { Restaurant } from '../../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../../../both/collections/restaurant/restaurant.collection';
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
    private _restaurants: Observable<Restaurant[]>;
    private _userDetails: Observable<UserDetail[]>;

    private _garnishFoodSub: Subscription;
    private _restaurantsSub: Subscription;
    private _currenciesSub: Subscription;
    private _countriesSub: Subscription;
    private _userDetailsSub: Subscription;

    public _dialogRef: MatDialogRef<any>;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _restaurantCurrencies: string[] = [];
    private _showCurrencies: boolean = false;
    private _restaurantTaxes: string[] = [];
    private _showTaxes: boolean = false;
    private _thereAreRestaurants: boolean = true;
    private _lRestaurantsId: string[] = [];
    private _thereAreUsers: boolean = false;
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

        this._restaurantsSub = MeteorObservable.subscribe('restaurants', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._restaurants = Restaurants.find({}).zone();
                Restaurants.collection.find({}).fetch().forEach((restaurant: Restaurant) => {
                    this._lRestaurantsId.push(restaurant._id);
                });
                this._userDetailsSub = MeteorObservable.subscribe('getUsersByRestaurantsId', this._lRestaurantsId).subscribe(() => {
                    this._userDetails = UserDetails.find({ current_restaurant: { $in: this._lRestaurantsId } }).zone();
                    this.countRestaurantsUsers();
                    this._userDetails.subscribe(() => { this.countRestaurantsUsers(); });
                });
                this.countRestaurants();
                this._restaurants.subscribe(() => { this.buildControls(); this.countRestaurants(); });
            });
        });

        this._garnishFoodSub = MeteorObservable.subscribe('garnishFood', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._garnishFoodCol = GarnishFoodCol.find({}).zone();
            });
        });
    }

    /**
     * Validate if restaurants exists
     */
    countRestaurants(): void {
        Restaurants.collection.find({}).count() > 0 ? this._thereAreRestaurants = true : this._thereAreRestaurants = false;
    }

    /**
     * Validate if restaurants exists
     */
    countRestaurantsUsers(): void {
        let auxUserCount: number;
        auxUserCount = UserDetails.collection.find({ current_restaurant: { $in: this._lRestaurantsId } }).count();

        if (auxUserCount > 0) {
            this._thereAreUsers = true
            this._usersCount = auxUserCount;
        } else {
            this._thereAreUsers = false;
            this._usersCount = 0;
        }
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._garnishFoodSub) { this._garnishFoodSub.unsubscribe(); }
        if (this._restaurantsSub) { this._restaurantsSub.unsubscribe(); }
        if (this._currenciesSub) { this._currenciesSub.unsubscribe(); }
        if (this._countriesSub) { this._countriesSub.unsubscribe(); }
        if (this._userDetailsSub) { this._userDetailsSub.unsubscribe(); }
    }

    /**
     * Function to build form controls
     */
    buildControls(): void {
        let _lRestaurantsId: string[] = [];
        this._restaurantCurrencies = [];
        this._restaurantTaxes = [];

        if (this._currenciesSub) { this._currenciesSub.unsubscribe(); }
        if (this._countriesSub) { this._countriesSub.unsubscribe(); }

        Restaurants.collection.find({}).fetch().forEach((res) => {
            _lRestaurantsId.push(res._id);
        });
        this._countriesSub = MeteorObservable.subscribe('getCountriesByRestaurantsId', _lRestaurantsId).subscribe();
        this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByRestaurantsId', _lRestaurantsId).subscribe(() => {
            this._ngZone.run(() => {
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
                        let control: FormControl = new FormControl(_initValue, [Validators.required]);
                        this._currenciesFormGroup.addControl(restaurant.currencyId, control);
                        this._restaurantCurrencies.push(restaurant.currencyId);

                        if (_lCountry.itemsWithDifferentTax === true) {
                            let control: FormControl = new FormControl('0', [Validators.required]);
                            this._taxesFormGroup.addControl(restaurant.currencyId, control);
                            this._restaurantTaxes.push(restaurant.currencyId);
                        }
                    }
                });
                this._restaurantCurrencies.length > 0 ? this._showCurrencies = true : this._showCurrencies = false;
                this._restaurantTaxes.length > 0 ? this._showTaxes = true : this._showTaxes = false;
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
        let _lGarnishFoodRestaurantsToInsert: GarnishFoodRestaurant[] = [];
        let _lGarnishFoodPricesToInsert: GarnishFoodPrice[] = [];

        arrCur.forEach((cur) => {
            let find: Restaurant[] = Restaurants.collection.find({}).fetch().filter(r => r.currencyId === cur);
            for (let res of find) {
                let _lGarnishFoodRestaurant: GarnishFoodRestaurant = { restaurantId: '', price: 0 };
                _lGarnishFoodRestaurant.restaurantId = res._id;
                _lGarnishFoodRestaurant.price = this._garnishFoodForm.value.currencies[cur];

                if (this._garnishFoodForm.value.taxes[cur] !== undefined) {
                    _lGarnishFoodRestaurant.garnishFoodTax = this._garnishFoodForm.value.taxes[cur];
                }

                _lGarnishFoodRestaurantsToInsert.push(_lGarnishFoodRestaurant);
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
            restaurants: _lGarnishFoodRestaurantsToInsert,
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
     * Function to cancel add Garnish Food
     */
    cancel(): void {
        this._garnishFoodForm.reset();
        this._restaurantCurrencies.length > 0 ? this._showCurrencies = true : this._showCurrencies = false;
        this._currenciesFormGroup.reset();
        this._taxesFormGroup.reset();
        this._restaurantTaxes.length > 0 ? this._showTaxes = true : this._showTaxes = false;
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
     * Go to add new Restaurant
     */
    goToAddRestaurant() {
        this._router.navigate(['/app/restaurant-register']);
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