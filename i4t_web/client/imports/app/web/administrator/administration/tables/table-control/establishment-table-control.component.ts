import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Router } from "@angular/router";
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Table } from '../../../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../../../both/collections/establishment/table.collection';
import { UserDetails } from '../../../../../../../../both/collections/auth/user-detail.collection';
import { Orders } from '../../../../../../../../both/collections/establishment/order.collection';
import { Account } from '../../../../../../../../both/models/establishment/account.model';
import { Accounts } from '../../../../../../../../both/collections/establishment/account.collection';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { Users } from '../../../../../../../../both/collections/auth/user.collection';
import { TableDetailComponent } from './table-detail/table-detail.component';

@Component({
    selector: 'establishment-table-control',
    templateUrl: './establishment-table-control.component.html',
    styleUrls: ['./establishment-table-control.component.scss']
})
export class EstablishmentTableControlComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();

    private _establishmentsSub: Subscription;
    private _tablesSub: Subscription;
    private _userDetailsSub: Subscription;
    private _accountsSub: Subscription;
    private _ordersSub: Subscription;
    private _currenciesSub: Subscription;

    private _establishments: Observable<Establishment[]>;
    private _establishmentsFilter: Observable<Establishment[]>;
    private _tables: Observable<Table[]>;

    private _thereAreEstablishments: boolean = true;

    /**
     * EstablishmentTableControlComponent Constructor
     * @param {Router} _router 
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private _router: Router,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentsSub = MeteorObservable.subscribe('establishments', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._establishmentsFilter = Establishments.find({}).zone();
                this._establishments = Establishments.find({}).zone();
                this.countEstablishments();
                this._establishments.subscribe(() => { this.countEstablishments(); });
            });
        });
        this._tablesSub = MeteorObservable.subscribe('tables', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._tables = Tables.find({}).zone();
            });
        });
        this._ordersSub = MeteorObservable.subscribe('getOrdersByAdminUser', this._user, ['ORDER_STATUS.REGISTERED', 'ORDER_STATUS.IN_PROCESS',
            'ORDER_STATUS.PREPARED', 'ORDER_STATUS.DELIVERED',
            'ORDER_STATUS.PENDING_CONFIRM']).subscribe();
        this._accountsSub = MeteorObservable.subscribe('getAccountsByAdminUser', this._user).subscribe();
        this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByUserId', this._user).subscribe();
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByAdminUser', this._user).subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if ( this._establishmentsSub) {  this._establishmentsSub.unsubscribe(); }
        if (this._tablesSub) { this._tablesSub.unsubscribe(); }
        if (this._userDetailsSub) { this._userDetailsSub.unsubscribe(); }
        if (this._accountsSub) { this._accountsSub.unsubscribe(); }
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._currenciesSub) { this._currenciesSub.unsubscribe(); }
    }

    /**
     * Return establishment currency
     * @param {string} _pEstablishmentCurrency 
     */
    getEstablishmentCurrency(_pEstablishmentCurrency: string): string {
        let _lCurrency: Currency = Currencies.findOne({ _id: _pEstablishmentCurrency });
        if (_lCurrency) {
            return _lCurrency.code;
        }
    }

    /**
     * Change Establishment Filter
     * @param {string} _pEstablishmentId 
     */
    changeEstablishmentFilter(_pEstablishmentId: string) {
        if (_pEstablishmentId === 'All') {
            this._establishments = Establishments.find({}).zone();
        } else {
            this._establishments = Establishments.find({ _id: _pEstablishmentId }).zone();
        }
    }

    /**
     * Validate if establishment exists
     */
    countEstablishments(): void {
        Establishments.collection.find({}).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * Return total payment account
     * @param {string} _pEstablishmentId
     * @param {string} _pTableId 
     */
    getPaymentAccount(_pEstablishmentId: string, _pTableId: string): number {
        let _lAccount: Account = Accounts.findOne({ establishment_id: _pEstablishmentId, tableId: _pTableId });
        if (_lAccount) {
            return _lAccount.total_payment;
        }
    }

    /**
     * Return table orders count
     * @param {string} _pEstablishmentId 
     * @param {string} _pTableId 
     */
    getTableOrders(_pEstablishmentId: string, _pTableId: string): number {
        return Orders.collection.find({ establishment_id: _pEstablishmentId, tableId: _pTableId }).count();
    }

    /**
     * Get Users in establishment
     * @param {string} _pEstablishmentId
     */
    getEstablishmentUsers(_pEstablishmentId: string): number {
        return UserDetails.collection.find({ current_establishment: _pEstablishmentId }).count();
    }

    /**
     * Go To Add Establishment Component
     */
    goToAddEstablishment(): void {
        this._router.navigate(['/app/establishment-register']);
    }

    /**
     * Open Table Detail Dialog
     * @param {string} _pEstablishmentId
     * @param {string} _pTableId
     * @param {string} _pTableNumber
     * @param {string} _pCurrencyId
     */
    openTableDetail(_pEstablishmentId: string, _pTableId: string, _pTableNumber: string, _pCurrencyId: string) {
        this._router.navigate(['app/table-detail', _pEstablishmentId, _pTableId, _pTableNumber, _pCurrencyId, '100'], { skipLocationChange: true });
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}