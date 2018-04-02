import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material';
import { Router } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { Currency } from '../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../both/collections/general/currency.collection';

@Component({
    selector: 'bags-payment',
    templateUrl: './bags-payment.component.html',
    styleUrls: ['./bags-payment.component.scss']
})

export class BagsPaymentComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _establishments: Observable<Establishment[]>;
    private _currencies: Observable<Currency[]>;
    private _establishmentSub: Subscription;
    private _currencySub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _currenciesArray: Currency[] = [];
    private displayedColumns = ['_id', 'isActive', 'name', 'code', 'numericCode', 'decimal'];
    private dataSource: any;

    /**
     * MonthlyPaymentComponent Constructor
     * @param {Router} router
     * @param {NgZone} _ngZone
     * @param {TranslateService} translate 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private router: Router,
        private translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
    }

    ngOnInit() {
        this.removeSubscriptions();

        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ creation_user: this._user }).zone();
            });
        });

        this._currencySub = MeteorObservable.subscribe('currencies').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._currencies = Currencies.find({}).zone();

            this._currenciesArray = Currencies.find({}).fetch();

            this.dataSource = new MatTableDataSource(this._currenciesArray);
            console.log(this._currenciesArray);
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {

    }
}