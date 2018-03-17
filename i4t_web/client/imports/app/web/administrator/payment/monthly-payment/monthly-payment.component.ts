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
    selector: 'monthly-payment',
    templateUrl: './monthly-payment.component.html',
    styleUrls: ['./monthly-payment.component.scss']
})
export class MonthlyPaymentComponent implements OnInit, OnDestroy {

    private _establishments: Observable<Establishment[]>;
    private _currencies: Observable<Currency[]>;
    private _tables: Observable<Table[]>;

    private _establishmentSub: Subscription;
    private _currencySub: Subscription;
    private _countrySub: Subscription;
    private _tableSub: Subscription;
    private _parameterSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _currentDate: Date;
    private _firstMonthDay: Date;
    private _lastMonthDay: Date;
    private _firstNextMonthDay: Date;
    private _maxPaymentDay: Date;
    private _establishmentsTotalPrice: number;
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
        this._establishmentSub = MeteorObservable.subscribe('currentEstablishmentsNoPayed', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        this._establishments = Establishments.find({ creation_user: Meteor.userId(), isActive: true }).zone();
        this._currencySub = MeteorObservable.subscribe('getCurrenciesByUserId').takeUntil(this._ngUnsubscribe).subscribe();
        this._currencies = Currencies.find({}).zone();
        this._countrySub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe();
        this._tableSub = MeteorObservable.subscribe('tables', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        this._parameterSub = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe(() => {
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
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
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
    getActiveTables(_establishment: Establishment): number {
        let tables_length: number;
        tables_length = Tables.find({ establishment_id: _establishment._id, is_active: true }).fetch().length;
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
        tables_length = Tables.collection.find({ establishment_id: _establishment._id, is_active: true }).count();

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
     * This function gets the total cost by establishment to pay for first and forward pays
     * @param {Establishment} _establishment
     * @return {number}
     */
    getTotalEstablishment(_establishment: Establishment): number {
        let country: Country;
        let tables_length: number;
        let discount: Parameter;

        country = Countries.findOne({ _id: _establishment.countryId });
        tables_length = Tables.find({ establishment_id: _establishment._id, is_active: true }).fetch().length;
        discount = Parameters.findOne({ name: 'first_pay_discount' });

        if (country && tables_length && discount) {
            if (_establishment.firstPay && !_establishment.freeDays) {
                return ((country.establishment_price + (country.tablePrice * tables_length))) * Number(discount.value) / 100;
            } else if (_establishment.firstPay && _establishment.freeDays) {
                return 0;
            } else {
                return country.establishment_price + (country.tablePrice * tables_length);
            }
        } else if (country && !tables_length && discount) {
            if (_establishment.firstPay && !_establishment.freeDays) {
                return country.establishment_price * Number(discount.value) / 100;
            } else if (_establishment.firstPay && _establishment.freeDays) {
                return 0;
            } else {
                return country.establishment_price;
            }
        }
    }

    /**
     * This function gets the total cost by establishment to pay
     * @param {Establishment} _establishment
     * @return {number}
     */
    getTotalEstablishmentNoDiscount(_establishment: Establishment): number {
        let country: Country;
        let tables_length: number;

        country = Countries.findOne({ _id: _establishment.countryId });
        tables_length = Tables.find({ establishment_id: _establishment._id, is_active: true }).fetch().length;

        if (country && tables_length) {
            return country.establishment_price + (country.tablePrice * tables_length);
        } else if (country && !tables_length) {
            return country.establishment_price;
        }
    }

    /**
     * This function gets the total cost by currency
     * @param {string} _currencyId
     * @return {number}
     */
    getTotalByCurrency(_currencyId: string): number {
        let price: number = 0;
        Establishments.collection.find({ currencyId: _currencyId, creation_user: Meteor.userId(), isActive: true }).forEach((establishment: Establishment) => {
            price = price + this.getTotalEstablishment(establishment);
        });
        this._establishmentsTotalPrice = price;
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
            let establishments = Establishments.collection.find({ creation_user: Meteor.userId(), isActive: true }).fetch();
            if (startDay && endDay && establishments) {
                if (currentDay >= Number(startDay.value) && currentDay <= Number(endDay.value) && (establishments.length > 0)) {
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
     * This function return true  if the user has only one establishment with freeDays true
     */
    getOnlyOneEstablishment(_currencyId: string): boolean {
        let establishmentCount: number = Establishments.collection.find({ creation_user: Meteor.userId(), currencyId: _currencyId, isActive: true }).count();
        let establishmentFreeDaysCount: number = Establishments.collection.find({ creation_user: Meteor.userId(), currencyId: _currencyId, freeDays: true, isActive: true }).count();

        if (establishmentCount === establishmentFreeDaysCount) {
            return false;
        } else if (establishmentCount !== establishmentFreeDaysCount) {
            return true;
        }
    }

    goToPaymentForm(currencyCode: string) {
        this.router.navigate(['app/payment-form', this._establishmentsTotalPrice, currencyCode, this._mode], { skipLocationChange: true });
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}
