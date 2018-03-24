import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { Currencies } from '../../../../../../../both/collections/general/currency.collection';
import { Currency } from '../../../../../../../both/models/general/currency.model';
import { Countries } from '../../../../../../../both/collections/general/country.collection';
import { Country } from '../../../../../../../both/models/general/country.model';
import { Tables } from '../../../../../../../both/collections/establishment/table.collection';
import { Table } from '../../../../../../../both/models/establishment/table.model';
import { Parameters } from '../../../../../../../both/collections/general/parameter.collection';
import { Parameter } from '../../../../../../../both/models/general/parameter.model';

@Component({
    selector: 'reactivate-establishment',
    templateUrl: './reactivate-establishment.component.html',
    styleUrls: ['./reactivate-establishment.component.scss']
})
export class ReactivateEstablishmentComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _currencySub: Subscription;
    private _countrySub: Subscription;
    private _establishmentSub: Subscription;
    private _parameterSub: Subscription;
    private _tableSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _currencies: Observable<Currency[]>;
    private _establishments: Observable<Establishment[]>;
    private _tables: Observable<Table[]>;

    private _currentDate: Date;
    private _lastMonthDay: Date;
    private _thereAreEstablishments: boolean = true;

    /**
     * ReactivateEstablishmentComponent Constructor
     * @param {Router} _router 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private _router: Router,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _userLanguageService: UserLanguageService,
        private _ngZone: NgZone) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ creation_user: this._user, isActive: false }).zone();
                this.countEstablishments();
                this._establishments.subscribe(() => { this.countEstablishments(); });
            });
        });
        this._currencySub = MeteorObservable.subscribe('getCurrenciesByUserId').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._currencies = Currencies.find({}).zone();
            });
        });
        this._countrySub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe();
        this._parameterSub = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let is_prod_flag = Parameters.findOne({ name: 'payu_is_prod' }).value;
                if (is_prod_flag == 'true') {
                    this._currentDate = new Date();
                    this._lastMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth() + 1, 0);
                } else {
                    let test_date = Parameters.findOne({ name: 'date_test_reactivate' }).value;
                    this._currentDate = new Date(test_date);
                    this._lastMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth() + 1, 0);
                }
            });
        });
        this._tableSub = MeteorObservable.subscribe('tables', this._user).takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Validate if establishments exists
     */
    countEstablishments(): void {
        Establishments.collection.find({ creation_user: this._user, isActive: false }).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
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
    * This function gets the establishment price according to the country
    * @param {Establishment} _establishment
    * @return {number} 
    */
    getEstablishmentPrice(_establishment: Establishment): number {
        let country: Country;
        country = Countries.findOne({ _id: _establishment.countryId });
        if (country) {
            return country.establishment_price;
        }
    }

    /**
     * This function gets the active tables by establishment
     * @param {Establishment} _establishment
     * @return {number}
     */
    getTables(_establishment: Establishment): number {
        let tables_length: number;
        tables_length = Tables.find({ establishment_id: _establishment._id }).fetch().length;
        if (tables_length) {
            return tables_length;
        } else {
            return 0;
        }
    }

    /**
     * This function gets de tables price by establishment and country cost
     * @param {Establishment} _establishment
     * @return {number}
     */
    getTablePrice(_establishment: Establishment): number {
        let tables_length: number;
        let country: Country;

        country = Countries.findOne({ _id: _establishment.countryId });
        tables_length = Tables.collection.find({ establishment_id: _establishment._id }).count();

        if (country && tables_length) {
            return country.tablePrice * tables_length;
        } else {
            return 0;
        }
    }

    /**
     * This function gets the total cost by establishment to pay for first and forward pays
     * @param {Establishment} _establishment
     * @return {number}
     */
    getTotalEstablishment(_establishment: Establishment): number {
        let country: Country;
        let tables_length: number;

        country = Countries.findOne({ _id: _establishment.countryId });
        tables_length = Tables.find({ establishment_id: _establishment._id }).fetch().length;

        if (country && tables_length) {
            return country.establishment_price + (country.tablePrice * tables_length);
        } else if (country && !tables_length) {
            return country.establishment_price;
        }
    }

    /**
     * This function get de total by establishment and sends to payu payment form
     * @param {Establishment} _establishment
     * @param {string} _currency
     */
    goToPayByEstablishment(_establishment: Establishment, _currencyCode: string) {
        let country: Country;
        let tables_length: number
        let priceByEstablishment: number;

        country = Countries.findOne({ _id: _establishment.countryId });
        tables_length = Tables.find({ establishment_id: _establishment._id }).fetch().length;

        if (country && tables_length) {
            priceByEstablishment = country.establishment_price + (country.tablePrice * tables_length);
        } else if (country && !tables_length) {
            priceByEstablishment = country.establishment_price;
        }
        this._router.navigate(['app/payment-form', priceByEstablishment, _currencyCode, _establishment._id], { skipLocationChange: true });
    }

    /**
     * This function validate the current day to return or not the customer payment
     * @return {boolean}
     */
    validatePeriodDays(): boolean {
        //let startDay = Parameters.findOne({ name: 'start_payment_day' });
        let endDay = Parameters.findOne({ name: 'end_payment_day' });
        let establishments = Establishments.collection.find({ creation_user: Meteor.userId(), isActive: false }).fetch();
        if (this._currentDate && this._lastMonthDay) {
            let currentDay = this._currentDate.getDate();
            let lastCurrentMonthDay = this._lastMonthDay.getDate();
            if (lastCurrentMonthDay && endDay && establishments) {
                if (currentDay > Number(endDay.value) && currentDay <= lastCurrentMonthDay && (establishments.length > 0)) {
                    return true;
                } else {
                    return false;
                }
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