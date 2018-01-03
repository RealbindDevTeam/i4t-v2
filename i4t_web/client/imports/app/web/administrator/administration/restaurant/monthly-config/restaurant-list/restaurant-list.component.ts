import { Component, OnInit, Input, Output, OnDestroy, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../../services/general/user-language.service';
import { Restaurant } from '../../../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../../../../both/collections/restaurant/restaurant.collection';
import { Table } from '../../../../../../../../../both/models/restaurant/table.model';
import { Tables } from '../../../../../../../../../both/collections/restaurant/table.collection';
import { Currencies } from '../../../../../../../../../both/collections/general/currency.collection';
import { Currency } from '../../../../../../../../../both/models/general/currency.model';
import { Countries } from '../../../../../../../../../both/collections/general/country.collection';
import { Country } from '../../../../../../../../../both/models/general/country.model';
import { Parameters } from '../../../../../../../../../both/collections/general/parameter.collection';
import { Parameter } from '../../../../../../../../../both/models/general/parameter.model';
import { PaymentsHistory } from '../../../../../../../../../both/collections/payment/payment-history.collection';
import { PaymentHistory } from '../../../../../../../../../both/models/payment/payment-history.model';

@Component({
    selector: 'restaurant-list',
    templateUrl: './restaurant-list.component.html',
    styleUrls: [ './restaurant-list.component.scss' ]
})
export class RestaurantListComponent implements OnInit, OnDestroy {

    @Output('gotoenabledisabled')
    restaurantId: EventEmitter<any> = new EventEmitter<any>();

    private _tableForm: FormGroup;
    private _restaurantSub: Subscription;
    private _currencySub: Subscription;
    private _tableSub: Subscription;
    private _countrySub: Subscription;
    private _paymentHistorySub: Subscription;

    private _restaurants: Observable<Restaurant[]>;
    private _currencies: Observable<Currency[]>;
    private _tables: Observable<Table[]>;
    private _parameters: Observable<Parameter[]>;

    private _currentDate: Date;
    private _parameterSub: Subscription;

    /**
     * RestaurantListComponent Constructor
     * @param {TranslateService} translate 
     * @param {Router} _router 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private translate: TranslateService,
        private _router: Router,
        private _userLanguageService: UserLanguageService) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
    }

    ngOnInit() {
        this.removeSubscription();
        this._tableForm = new FormGroup({
            restaurant: new FormControl('', [Validators.required]),
            tables_number: new FormControl('', [Validators.required])
        });
        this._restaurantSub = MeteorObservable.subscribe('restaurants', Meteor.userId()).subscribe(() => {
            this._restaurants = Restaurants.find({}).zone();
        });
        this._tableSub = MeteorObservable.subscribe('tables', Meteor.userId()).subscribe(() => {
            this._tables = this._tables = Tables.find({}).zone();
        });
        this._currencySub = MeteorObservable.subscribe('getCurrenciesByUserId').subscribe(() => {
            this._currencies = Currencies.find({}).zone();
        });
        this._countrySub = MeteorObservable.subscribe('countries').subscribe();
        this._parameterSub = MeteorObservable.subscribe('getParameters').subscribe();
        this._paymentHistorySub = MeteorObservable.subscribe('getHistoryPaymentsByUser', Meteor.userId()).subscribe();

        this._currentDate = new Date();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscription(): void {
        if (this._restaurantSub) { this._restaurantSub.unsubscribe(); }
        if (this._tableSub) { this._tableSub.unsubscribe(); }
        if (this._currencySub) { this._currencySub.unsubscribe(); }
        if (this._countrySub) { this._countrySub.unsubscribe(); }
        if (this._parameterSub) { this._parameterSub.unsubscribe(); }
        if (this._paymentHistorySub) { this._paymentHistorySub.unsubscribe(); }
    }

    /**
    * This function gets the coutry according to currency
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
     * This function gets all tables by restaurant
     * @param {Restaurant} _restaurant
     * @return {number}
     */
    getAllTables(_restaurant: Restaurant): number {
        let tables_length: number;
        tables_length = Tables.find({ restaurantId: _restaurant._id }).fetch().length;
        if (tables_length) {
            return tables_length;
        } else {
            return 0;
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
     * This function gets the restaurant status
     * @param {Restaurant} _restaurant
     * @return {string}
     */
    getRestaurantStatus(_restaurant: Restaurant): string {
        if (_restaurant.isActive === true) {
            return 'MONTHLY_CONFIG.STATUS_ACTIVE';
        } else {
            return 'MONTHLY_CONFIG.STATUS_INACTIVE';
        }
    }

    /**
     * This function goes to the enable disable component
     * @param {string} _restaurant
     */
    goToEnableDisable(restaurantId: string) {
        this.restaurantId.emit(restaurantId);
    }

    /**
     * This function validate the current day to return or not the customer payment
     * @return {boolean}
     */
    validatePeriodDays(): boolean {
        let startDay = Parameters.findOne({ name: 'start_payment_day' });
        let endDay = Parameters.findOne({ name: 'end_payment_day' });
        let currentDay = this._currentDate.getDate();
        let restaurants = Restaurants.collection.find({ creation_user: Meteor.userId() }).fetch();

        if (startDay && endDay && restaurants) {
            if (currentDay >= Number(startDay.value) && currentDay <= Number(endDay.value) && (restaurants.length > 0)) {
                return true;
            } else {
                return false;
            }
        }
    }

    /**
     * This function validate the conditions for enable or disable modify button
     * @param {Restaurant} _restaurant
     * @return {string}
     */
    validateConditions(_restaurant: Restaurant): boolean {
        let periodDays: boolean;
        let paymentHistory: PaymentHistory;
        if (_restaurant.freeDays) {
            return false;
        } else {
            periodDays = this.validatePeriodDays();
            if (periodDays) {
                paymentHistory = PaymentsHistory.findOne({
                    month: (this._currentDate.getMonth() + 1).toString(),
                    year: (this._currentDate.getFullYear()).toString(),
                    restaurantIds: {
                        $in: [_restaurant._id]
                    },
                    status: 'TRANSACTION_STATUS.APPROVED'
                });
                if (paymentHistory) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return !periodDays;
            }
        }
    }


    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscription();
    }
}