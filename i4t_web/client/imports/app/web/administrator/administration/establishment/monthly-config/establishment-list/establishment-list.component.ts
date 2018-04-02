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
    private _thereAreEstablishments: boolean = true;

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
            this._ngZone.run(() => {
                this._establishments = Establishments.find({}).zone();
                this.countEstablishments();
                this._establishments.subscribe(() => { this.countEstablishments(); });

                this._currencySub = MeteorObservable.subscribe('getCurrenciesByUserId', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        let _currenciesIds: string[] = [];
                        Establishments.collection.find({ creation_user: Meteor.userId() }).forEach(function <Establishment>(establishment, index, args) {
                            _currenciesIds.push(establishment.currencyId);
                        });
                        this._currencies = Currencies.find({ _id: { $in: _currenciesIds } }).zone();
                    });
                });
            });
        });
        this._tableSub = MeteorObservable.subscribe('tables', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._tables = this._tables = Tables.find({}).zone();
            });
        });

        this._countrySub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe();
        this._paymentHistorySub = MeteorObservable.subscribe('getHistoryPaymentsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
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
    removeSubscription(): void {
        /**
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
         */
        if (this._establishmentSub) { this._establishmentSub.unsubscribe(); }
        if (this._tableSub) { this._tableSub.unsubscribe(); }
        if (this._currencySub) { this._currencySub.unsubscribe(); }
        if (this._countrySub) { this._countrySub.unsubscribe(); }
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
        this._router.navigate(['app/enable-disable', _establishment], { skipLocationChange: true });
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscription();
    }
}