import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Restaurants } from '../../../../../../../both/collections/restaurant/restaurant.collection';
import { Restaurant } from '../../../../../../../both/models/restaurant/restaurant.model';
import { Currencies } from '../../../../../../../both/collections/general/currency.collection';
import { Currency } from '../../../../../../../both/models/general/currency.model';
import { Countries } from '../../../../../../../both/collections/general/country.collection';
import { Country } from '../../../../../../../both/models/general/country.model';
import { Tables } from '../../../../../../../both/collections/restaurant/table.collection';
import { Table } from '../../../../../../../both/models/restaurant/table.model';
import { Parameters } from '../../../../../../../both/collections/general/parameter.collection';
import { Parameter } from '../../../../../../../both/models/general/parameter.model';

@Component({
    selector: 'monthly-payment',
    templateUrl: './monthly-payment.component.html',
    styleUrls: ['./monthly-payment.component.scss']
})
export class MonthlyPaymentComponent implements OnInit, OnDestroy {

    private _restaurants: Observable<Restaurant[]>;
    private _currencies: Observable<Currency[]>;
    private _tables: Observable<Table[]>;

    private _restaurantSub: Subscription;
    private _currencySub: Subscription;
    private _countrySub: Subscription;
    private _tableSub: Subscription;
    private _parameterSub: Subscription;

    private _restaurantsArray: Restaurant[];
    private _currentDate: Date;
    private _firstMonthDay: Date;
    private _lastMonthDay: Date;
    private _firstNextMonthDay: Date;
    private _maxPaymentDay: Date;
    private _restaurantsTotalPrice: number;
    private _mode: string;

    /**
     * MonthlyPaymentComponent Constructor
     * @param {Router} router 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} translate 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private router: Router,
        private _formBuilder: FormBuilder,
        private translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
        this._mode = 'normal';
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._restaurantSub = MeteorObservable.subscribe('currentRestaurantsNoPayed', Meteor.userId()).subscribe();
        this._restaurants = Restaurants.find({ creation_user: Meteor.userId(), isActive: true }).zone();
        this._currencySub = MeteorObservable.subscribe('getCurrenciesByUserId').subscribe();
        this._currencies = Currencies.find({}).zone();
        this._countrySub = MeteorObservable.subscribe('countries').subscribe();
        this._tableSub = MeteorObservable.subscribe('tables', Meteor.userId()).subscribe();
        this._parameterSub = MeteorObservable.subscribe('getParameters').subscribe(() => {
            this._ngZone.run(() => {
                let is_prod_flag = Parameters.findOne({ name: 'payu_is_prod' }).value;
                if (is_prod_flag == 'true') {
                    this._currentDate = new Date();
                    this._firstMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth(), 1);
                    this._lastMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth() + 1, 0);
                    this._firstNextMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth() + 1, 1);
                } else {
                    let test_date = Parameters.findOne({ name: 'date_test_monthly_pay' }).value;
                    this._currentDate = new Date(test_date);
                    this._firstMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth(), 1);
                    this._lastMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth() + 1, 0);
                    this._firstNextMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth() + 1, 1);
                }
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._restaurantSub) { this._restaurantSub.unsubscribe(); }
        if (this._currencySub) { this._currencySub.unsubscribe(); }
        if (this._countrySub) { this._countrySub.unsubscribe(); }
        if (this._tableSub) { this._tableSub.unsubscribe(); }
        if (this._parameterSub) { this._parameterSub.unsubscribe(); }
    }

    /**
     * This function gets the restaurant price according to the country
     * @param {Restaurant} _restaurant
     * @return {number} 
     */
    getRestaurantPrice(_restaurant: Restaurant): number {
        let country: Country;
        country = Countries.findOne({ _id: _restaurant.countryId });
        if (country) {
            return country.restaurantPrice;
        }
    }

    /**
     * This function gets the active tables by restaurant
     * @param {Restaurant} _restaurant
     * @return {number}
     */
    getActiveTables(_restaurant: Restaurant): number {
        let tables_length: number;
        tables_length = Tables.find({ restaurantId: _restaurant._id, is_active: true }).fetch().length;
        if (tables_length) {
            return tables_length;
        } else {
            return 0;
        }
    }

    /**
     * This function gets de tables price by restaurant and country cost
     * @param {Restaurant} _restaurant
     * @return {number}
     */
    getTablePrice(_restaurant: Restaurant): number {
        let tables_length: number;
        let country: Country;

        country = Countries.findOne({ _id: _restaurant.countryId });
        tables_length = Tables.collection.find({ restaurantId: _restaurant._id, is_active: true }).count();

        if (country && tables_length) {
            return country.tablePrice * tables_length;
        } else {
            return 0;
        }
    }

    /**
     * This function gets the coutry accordint to currency
     * @param {string} _currencyId
     * @return {string}
     */
    getCountryByCurrency(_currencyId: string): string {
        let country_name: Country;
        country_name = Countries.findOne({ currencyId: _currencyId });
        if (country_name) {
            return country_name.name;
        } else {
            return "";
        }
    }

    /**
     * This function gets the unit table price according to the currency
     * @param {string} _currencyId
     * @return {number}
     */
    getUnitTablePrice(_currencyId: string): number {
        let country_table_price: Country;
        country_table_price = Countries.findOne({ currencyId: _currencyId });
        if (country_table_price) {
            return country_table_price.tablePrice;
        }
    }

    /**
     * This function gets the total cost by restaurant to pay for first and forward pays
     * @param {Restaurant} _restaurant
     * @return {number}
     */
    getTotalRestaurant(_restaurant: Restaurant): number {
        let country: Country;
        let tables_length: number;
        let discount: Parameter;

        country = Countries.findOne({ _id: _restaurant.countryId });
        tables_length = Tables.find({ restaurantId: _restaurant._id, is_active: true }).fetch().length;
        discount = Parameters.findOne({ name: 'first_pay_discount' });

        if (country && tables_length && discount) {
            if (_restaurant.firstPay && !_restaurant.freeDays) {
                return ((country.restaurantPrice + (country.tablePrice * tables_length))) * Number(discount.value) / 100;
            } else if (_restaurant.firstPay && _restaurant.freeDays) {
                return 0;
            } else {
                return country.restaurantPrice + (country.tablePrice * tables_length);
            }
        } else if (country && !tables_length && discount) {
            if (_restaurant.firstPay && !_restaurant.freeDays) {
                return country.restaurantPrice * Number(discount.value) / 100;
            } else if (_restaurant.firstPay && _restaurant.freeDays) {
                return 0;
            } else {
                return country.restaurantPrice;
            }
        }
    }

    /**
     * This function gets the total cost by restaurant to pay
     * @param {Restaurant} _restaurant
     * @return {number}
     */
    getTotalRestaurantNoDiscount(_restaurant: Restaurant): number {
        let country: Country;
        let tables_length: number;

        country = Countries.findOne({ _id: _restaurant.countryId });
        tables_length = Tables.find({ restaurantId: _restaurant._id, is_active: true }).fetch().length;

        if (country && tables_length) {
            return country.restaurantPrice + (country.tablePrice * tables_length);
        } else if (country && !tables_length) {
            return country.restaurantPrice;
        }
    }

    /**
     * This function gets the total cost by currency
     * @param {string} _currencyId
     * @return {number}
     */
    getTotalByCurrency(_currencyId: string): number {
        let price: number = 0;
        Restaurants.collection.find({ currencyId: _currencyId, creation_user: Meteor.userId(), isActive: true }).forEach((restaurant: Restaurant) => {
            price = price + this.getTotalRestaurant(restaurant);
        });
        this._restaurantsTotalPrice = price;
        return price;
    }

    /**
     * This function gets the discount
     * @return {string}
     */
    getDiscount(): string {
        let discount: Parameter;
        discount = Parameters.findOne({ name: 'first_pay_discount' });
        if (discount) {
            return discount.value;
        }
    }

    /**
     * This function validate the current day to return or not the customer payment
     * @return {boolean}
     */
    validatePeriodDays(): boolean {
        let startDay = Parameters.findOne({ name: 'start_payment_day' });
        let endDay = Parameters.findOne({ name: 'end_payment_day' });
        if (this._currentDate) {
            let currentDay = this._currentDate.getDate();
            let restaurants = Restaurants.collection.find({ creation_user: Meteor.userId(), isActive: true }).fetch();
            if (startDay && endDay && restaurants) {
                if (currentDay >= Number(startDay.value) && currentDay <= Number(endDay.value) && (restaurants.length > 0)) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }

    /**
     * This function return the max day to pay
     * @return {Date}
     */
    getMaxPaymentDay(): Date {
        this._maxPaymentDay = new Date(this._firstMonthDay);
        let endDay = Parameters.findOne({ name: 'end_payment_day' });
        if (endDay) {
            this._maxPaymentDay.setDate(this._maxPaymentDay.getDate() + (Number(endDay.value) - 1));
            return this._maxPaymentDay;
        }
    }

    /**
     * This function return true  if the user has only one restaurant with freeDays true
     */
    getOnlyOneRestaurant(_currencyId: string): boolean {
        let restaurantCount: number = Restaurants.collection.find({ creation_user: Meteor.userId(), currencyId: _currencyId, isActive: true }).count();
        let restaurantFreeDaysCount: number = Restaurants.collection.find({ creation_user: Meteor.userId(), currencyId: _currencyId, freeDays: true, isActive: true }).count();

        if (restaurantCount === restaurantFreeDaysCount) {
            return false;
        } else if (restaurantCount !== restaurantFreeDaysCount) {
            return true;
        }
    }

    goToPaymentForm(currencyCode: string) {
        this.router.navigate(['app/payment-form', this._restaurantsTotalPrice, currencyCode, this._mode], { skipLocationChange: true });
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}
