import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { MeteorObservable } from 'meteor-rxjs';
import { Observable, Subscription, Subject } from 'rxjs';
import { UserLanguageService } from '../../services/general/user-language.service';
import { Countries } from '../../../../../../both/collections/general/country.collection';
import { Country } from '../../../../../../both/models/general/country.model';
import { Currency } from '../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../both/collections/general/currency.collection';

@Component({
    selector: 'payment-plan-info',
    templateUrl: './payment-plan-info.component.html',
    styleUrls: ['./payment-plan-info.component.scss'],
    providers: [UserLanguageService]
})
export class PaymentPlanInfo implements OnInit, OnDestroy {

    private _currenciesSubscription: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _currency: Currency;
    private _country: Country;
    private _countrySelected: Country;
    private _countries: Observable<Country[]>;

    private _countryId: string = "";
    private _establishmentsUnits: number = 0;
    private _tablesUnits: number = 0;
    private _total: number = 0;

    constructor(public _dialogRef: MatDialogRef<any>,
        protected zone: NgZone) {
    }

    ngOnInit() {
        this._currenciesSubscription = MeteorObservable.subscribe('currencies').takeUntil(this._ngUnsubscribe).subscribe();

        this.zone.run(() => {
            this._countries = Countries.find({}).zone();
        });
    }

    calculate() {
        if (this._countryId && this._establishmentsUnits >= 0 && this._tablesUnits >= 0) {
            if (this._countryId) {
                this._country = Countries.findOne({ _id: this._countryId });
                if (this._country) {
                    this._currency = Currencies.findOne({ _id: this._country.currencyId });
                    this._total = (Number.parseInt(this._country.establishment_price.toString()) * this._establishmentsUnits) +
                        (Number.parseInt(this._country.tablePrice.toString()) * this._tablesUnits);
                }
            }
        }
    }

    cancel() {
        this._dialogRef.close({ success: false });
    }

    ngOnDestroy() {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

}