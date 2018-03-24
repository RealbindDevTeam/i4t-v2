import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { Router } from "@angular/router";
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../services/general/user-language.service';
import { Establishment } from '../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../both/collections/establishment/establishment.collection';
import { Table } from '../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../both/collections/establishment/table.collection';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { Users } from '../../../../../../both/collections/auth/user.collection';

@Component({
    selector: 'supervisor-establishment-table-control',
    templateUrl: './supervisor-establishment-table-control.component.html',
    styleUrls: ['./supervisor-establishment-table-control.component.scss']
})
export class SupervisorEstablishmentTableControlComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();

    private _establishmentsSub: Subscription;
    private _tablesSub: Subscription;
    private _userDetailsSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishments: Observable<Establishment[]>;
    private _tables: Observable<Table[]>;

    private _thereAreEstablishments: boolean = true;

    /**
     * SupervisorEstablishmentTableControlComponent Constructor
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
        this._establishmentsSub = MeteorObservable.subscribe('getEstablishmentByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({}).zone();
                this.countEstablishments();
                this._establishments.subscribe(() => { this.countEstablishments(); });
            });
        });
        this._tablesSub = MeteorObservable.subscribe('getTablesByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._tables = Tables.find({}).zone();
            });
        });
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Validate if establishments exists
     */
    countEstablishments(): void {
        Establishments.collection.find({}).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * Get Users in establishment
     * @param {string} _pEstablishmentId
     */
    getEstablishmentUsers(_pEstablishmentId: string): number {
        return UserDetails.collection.find({ current_establishment: _pEstablishmentId }).count();
    }

    /**
     * Open Table Detail Dialog
     * @param {string} _pEstablishmentId
     * @param {string} _pTableId
     * @param {string} _pTableNumber
     * @param {string} _pCurrencyId
     */
    openTableDetail(_pEstablishmentId: string, _pTableId: string, _pTableNumber: string, _pCurrencyId: string) {
        this._router.navigate(['app/table-detail', _pEstablishmentId, _pTableId, _pTableNumber, _pCurrencyId, '600'], { skipLocationChange: true });
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}