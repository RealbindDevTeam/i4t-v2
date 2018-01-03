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
    selector: 'reactivate-restaurant',
    templateUrl: './reactivate-restaurant.component.html',
    styleUrls: [ './reactivate-restaurant.component.scss' ]
})
export class ReactivateRestaurantComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _currencySub: Subscription;
    private _countrySub: Subscription;
    private _restaurantSub: Subscription;
    private _parameterSub: Subscription;
    private _tableSub: Subscription;

    private _currencies: Observable<Currency[]>;
    private _restaurants: Observable<Restaurant[]>;
    private _tables: Observable<Table[]>;

    private _currentDate: Date;
    private _firstMonthDay: Date;
    private _lastMonthDay: Date;
    private _firstNextMonthDay: Date;
    private _thereAreRestaurants: boolean = true;

    /**
     * ReactivateRestaurantComponent Constructor
     * @param {Router} _router 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private _router: Router,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _userLanguageService: UserLanguageService,
        private _ngZone: NgZone ) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._restaurantSub = MeteorObservable.subscribe('restaurants', this._user).subscribe( () => {
            this._ngZone.run( () => {
                this._restaurants = Restaurants.find({ creation_user: this._user, isActive: false }).zone();
                this.countRestaurants();
                this._restaurants.subscribe( () => { this.countRestaurants(); });
            });
        });
        this._currencySub = MeteorObservable.subscribe('getCurrenciesByUserId').subscribe( () => {
            this._ngZone.run( () => {
                this._currencies = Currencies.find({}).zone();
            });
        });
        this._countrySub = MeteorObservable.subscribe('countries').subscribe();
        this._parameterSub = MeteorObservable.subscribe('getParameters').subscribe();
        this._tableSub = MeteorObservable.subscribe('tables', this._user).subscribe();

        this._currentDate = new Date();
        this._firstMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth(), 1);
        this._lastMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth() + 1, 0);
        this._firstNextMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth() + 1, 1);
    }

    /**
     * Validate if restaurants exists
     */
    countRestaurants():void{
        Restaurants.collection.find( { creation_user: this._user, isActive: false } ).count() > 0 ? this._thereAreRestaurants = true : this._thereAreRestaurants = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._currencySub) { this._currencySub.unsubscribe(); }
        if (this._countrySub) { this._countrySub.unsubscribe(); }
        if (this._restaurantSub) { this._restaurantSub.unsubscribe(); }
        if (this._parameterSub) { this._parameterSub.unsubscribe(); }
        if (this._tableSub) { this._tableSub.unsubscribe(); }
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
    getTables(_restaurant: Restaurant): number {
        let tables_length: number;
        tables_length = Tables.find({ restaurantId: _restaurant._id }).fetch().length;
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
        tables_length = Tables.collection.find({ restaurantId: _restaurant._id }).count();

        if (country && tables_length) {
            return country.tablePrice * tables_length;
        } else {
            return 0;
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

        country = Countries.findOne({ _id: _restaurant.countryId });
        tables_length = Tables.find({ restaurantId: _restaurant._id }).fetch().length;

        if (country && tables_length) {
            return country.restaurantPrice + (country.tablePrice * tables_length);
        } else if (country && !tables_length) {
            return country.restaurantPrice;
        }
    }

    /**
     * This function get de total by restaurant and sends to payu payment form
     * @param {Restaurant} _restaurant
     * @param {string} _currency
     */
    goToPayByRestaurant(_restaurant: Restaurant, _currencyCode: string) {
        let country: Country;
        let tables_length: number
        let priceByRestaurant: number;

        country = Countries.findOne({ _id: _restaurant.countryId });
        tables_length = Tables.find({ restaurantId: _restaurant._id }).fetch().length;

        if (country && tables_length) {
            priceByRestaurant = country.restaurantPrice + (country.tablePrice * tables_length);
        } else if (country && !tables_length) {
            priceByRestaurant = country.restaurantPrice;
        }
        this._router.navigate(['app/payment-form', priceByRestaurant, _currencyCode, _restaurant._id], { skipLocationChange: true });
    }

    /**
     * This function validate the current day to return or not the customer payment
     * @return {boolean}
     */
    validatePeriodDays(): boolean {
        //let startDay = Parameters.findOne({ name: 'start_payment_day' });
        let endDay = Parameters.findOne({ name: 'end_payment_day' });
        let lastCurrentMonthDay = this._lastMonthDay.getDate();
        let currentDay = this._currentDate.getDate();
        let restaurants = Restaurants.collection.find({ creation_user: Meteor.userId(), isActive: false }).fetch();
        if (lastCurrentMonthDay && endDay && restaurants) {
            if (currentDay > Number(endDay.value) && currentDay <= lastCurrentMonthDay && (restaurants.length > 0)) {
                return true;
            } else {
                return false;
            }
        }
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}