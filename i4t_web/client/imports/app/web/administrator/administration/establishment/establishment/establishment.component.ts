import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from "@angular/router";
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Country } from '../../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../../both/collections/general/country.collection';
import { City } from '../../../../../../../../both/models/general/city.model';
import { Cities } from '../../../../../../../../both/collections/general/city.collection';

@Component({
    selector: 'establishment',
    templateUrl: './establishment.component.html',
    styleUrls: ['./establishment.component.scss']
})
export class EstablishmentComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private establishments: Observable<Establishment[]>;

    private establishmentSub: Subscription;
    private countriesSub: Subscription;
    private citiesSub: Subscription;

    public _dialogRef: MatDialogRef<any>;
    private _thereAreEstablishments: boolean = true;

    /**
     * EstablishmentComponent Constructor
     * @param {Router} router 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} translate 
     * @param {MatDialog} _dialog
     * @param {NgZone} _ngZone
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private router: Router,
        private _formBuilder: FormBuilder,
        private translate: TranslateService,
        public _dialog: MatDialog,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this.establishmentSub = MeteorObservable.subscribe('establishments', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this.establishments = Establishments.find({ creation_user: this._user }).zone();
                this.countEstablishments();
                this.establishments.subscribe(() => { this.countEstablishments(); });
            });
        });
        this.countriesSub = MeteorObservable.subscribe('countries').subscribe();
        this.citiesSub = MeteorObservable.subscribe('cities').subscribe();
    }

    /**
     * Validate if establishments exists
     */
    countEstablishments(): void {
        Establishments.collection.find({ creation_user: this._user }).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this.establishmentSub) { this.establishmentSub.unsubscribe(); }
        if (this.countriesSub) { this.countriesSub.unsubscribe(); }
        if (this.citiesSub) { this.citiesSub.unsubscribe(); }
    }

    /**
     * Function to open EstablishmentRegisterComponent
     */
    openEstablishmentRegister() {
        this.router.navigate(['app/establishment-register']);
    }

    /**
     * Function to open EstablishmentEditionComponent
     * @param {Establishment} _establishment 
     */
    openEstablishmentEdition(_establishment: Establishment) {
        this.router.navigate(['app/establishment-edition', JSON.stringify(_establishment)], { skipLocationChange: true });
    }

    /**
     * Get Establishment Country
     * @param {string} _pCountryId
     */
    getEstablishmentCountry(_pCountryId: string): string {
        let _lCountry: Country = Countries.findOne({ _id: _pCountryId });
        if (_lCountry) {
            return _lCountry.name;
        }
    }

    /**
     * Get Establishment City
     * @param {string} _pCityId 
     * @param {string} _pOtherCity
     */
    getEstablishmentCity(_pCityId: string, _pOtherCity: string): string {
        let _lCity: City = Cities.findOne({ _id: _pCityId });
        if (_lCity) {
            return _lCity.name;
        } else {
            return _pOtherCity;
        }
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}