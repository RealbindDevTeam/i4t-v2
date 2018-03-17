import { Component, OnInit, Input, Output, OnDestroy, EventEmitter, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../../services/general/user-language.service';
import { Establishment } from '../../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../../both/collections/establishment/establishment.collection';
import { Table } from '../../../../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../../../../both/collections/establishment/table.collection';
import { Currencies } from '../../../../../../../../../both/collections/general/currency.collection';
import { Currency } from '../../../../../../../../../both/models/general/currency.model';
import { Countries } from '../../../../../../../../../both/collections/general/country.collection';
import { Country } from '../../../../../../../../../both/models/general/country.model';
import { Parameters } from '../../../../../../../../../both/collections/general/parameter.collection';
import { Parameter } from '../../../../../../../../../both/models/general/parameter.model';
import { PaymentsHistory } from '../../../../../../../../../both/collections/payment/payment-history.collection';
import { PaymentHistory } from '../../../../../../../../../both/models/payment/payment-history.model';

@Component({
    selector: 'establishment-list',
    templateUrl: './establishment-list.component.html',
    styleUrls: ['./establishment-list.component.scss']
})
export class EstablishmentListComponent implements OnInit, OnDestroy {

    @Output('gotoenabledisabled')
    establishmentId: EventEmitter<any> = new EventEmitter<any>();

    private _tableForm: FormGroup;
    private _establishmentSub: Subscription;
    private _currencySub: Subscription;
    private _tableSub: Subscription;
    private _countrySub: Subscription;
    private _paymentHistorySub: Subscription;
    private _parameterSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishments: Observable<Establishment[]>;
    private _currencies: Observable<Currency[]>;
    private _tables: Observable<Table[]>;
    private _parameters: Observable<Parameter[]>;

    private _currentDate: Date;

    /**
     * EstablishmentListComponent Constructor
     * @param {TranslateService} translate 
     * @param {Router} _router 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private translate: TranslateService,
        private _router: Router,
        private _userLanguageService: UserLanguageService,
        private _ngZone: NgZone) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
    }

    ngOnInit() {
        this.removeSubscription();
        this._tableForm = new FormGroup({
            establishment: new FormControl('', [Validators.required]),
            tables_number: new FormControl('', [Validators.required])
        });
        this._establishmentSub = MeteorObservable.subscribe('establishments', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._establishments = Establishments.find({}).zone();
        });
        this._tableSub = MeteorObservable.subscribe('tables', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._tables = this._tables = Tables.find({}).zone();
        });
        this._currencySub = MeteorObservable.subscribe('getCurrenciesByUserId').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._currencies = Currencies.find({}).zone();
        });
        this._countrySub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe();
        this._parameterSub = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let is_prod_flag = Parameters.findOne({ name: 'payu_is_prod' }).value;
                if (is_prod_flag == 'true') {
                    this._currentDate = new Date();
                } else {
                    let test_date = Parameters.findOne({ name: 'date_test_monthly_pay' }).value;
                    this._currentDate = new Date(test_date);
                }
            });
        });
        this._paymentHistorySub = MeteorObservable.subscribe('getHistoryPaymentsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscription(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
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
     * This function gets all tables by establishment
     * @param {Establishment} _establishment
     * @return {number}
     */
    getAllTables(_establishment: Establishment): number {
        let tables_length: number;
        tables_length = Tables.find({ establishment_id: _establishment._id }).fetch().length;
        if (tables_length) {
            return tables_length;
        } else {
            return 0;
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
     * This function gets the establishment status
     * @param {Establishment} _establishment
     * @return {string}
     */
    getEstablishmentStatus(_establishment: Establishment): string {
        if (_establishment.isActive === true) {
            return 'MONTHLY_CONFIG.STATUS_ACTIVE';
        } else {
            return 'MONTHLY_CONFIG.STATUS_INACTIVE';
        }
    }

    /**
     * This function goes to the enable disable component
     * @param {string} _establishment
     */
    goToEnableDisable(_establishment: string) {
        this.establishmentId.emit(_establishment);
    }

    /**
     * This function validate the current day to return or not the customer payment
     * @return {boolean}
     */
    validatePeriodDays(): boolean {
        let startDay = Parameters.findOne({ name: 'start_payment_day' });
        let endDay = Parameters.findOne({ name: 'end_payment_day' });
        let currentDay = this._currentDate.getDate();
        let establishments = Establishments.collection.find({ creation_user: Meteor.userId() }).fetch();

        if (startDay && endDay && establishments) {
            if (currentDay >= Number(startDay.value) && currentDay <= Number(endDay.value) && (establishments.length > 0)) {
                return true;
            } else {
                return false;
            }
        }
    }

    /**
     * This function validate the conditions for enable or disable modify button
     * @param {Establishment} _establishment
     * @return {string}
     */
    validateConditions(_establishment: Establishment): boolean {
        let periodDays: boolean;
        let paymentHistory: PaymentHistory;
        if (_establishment.freeDays) {
            return false;
        } else {
            periodDays = this.validatePeriodDays();
            if (periodDays) {
                paymentHistory = PaymentsHistory.findOne({
                    month: (this._currentDate.getMonth() + 1).toString(),
                    year: (this._currentDate.getFullYear()).toString(),
                    establishment_ids: {
                        $in: [_establishment._id]
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