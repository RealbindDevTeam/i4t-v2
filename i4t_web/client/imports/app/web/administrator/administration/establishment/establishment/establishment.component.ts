import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
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
import { UserDetails } from '../../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../../both/models/auth/user-detail.model';
import { EstablishmentPoint } from '../../../../../../../../both/models/points/establishment-point.model';
import { EstablishmentPoints } from '../../../../../../../../both/collections/points/establishment-points.collection';

@Component({
    selector: 'establishment',
    templateUrl: './establishment.component.html',
    styleUrls: ['./establishment.component.scss']
})
export class EstablishmentComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private establishments: Observable<Establishment[]>;
    private _userDetails: Observable<UserDetail[]>;

    private establishmentSub: Subscription;
    private countriesSub: Subscription;
    private citiesSub: Subscription;
    private _usersDetailsSub: Subscription;
    private _establishmentPointsSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    public _dialogRef: MatDialogRef<any>;
    private _thereAreEstablishments: boolean = true;
    private _thereAreCollaborators: boolean = true;

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
        this.establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let _establishmentIds: string[] = [];
                this.establishments = Establishments.find({ creation_user: this._user }).zone();
                Establishments.collection.find({ creation_user: this._user }).fetch().forEach((establishment) => {
                    _establishmentIds.push(establishment._id);
                });
                this.countEstablishments();
                this.establishments.subscribe(() => { this.countEstablishments(); this.validateWaiters(); });
                this._usersDetailsSub = MeteorObservable.subscribe('getUsersCollaboratorsByEstablishmentsId', _establishmentIds).takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this._userDetails = UserDetails.find({ establishment_work: { $in: _establishmentIds }, role_id: '200' }).zone();
                        this.validateWaiters();
                        this._userDetails.subscribe(() => { this.validateWaiters(); });

                    });
                });
                this._establishmentPointsSub = MeteorObservable.subscribe('getEstablishmentPointsByIds', _establishmentIds).takeUntil(this._ngUnsubscribe).subscribe();
            });
        });
        this.countriesSub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe();
        this.citiesSub = MeteorObservable.subscribe('cities').takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Validate if establishments exists
     */
    countEstablishments(): void {
        Establishments.collection.find({ creation_user: this._user }).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * this function validate if administrator establishments have waiters and show message if not
     */
    validateWaiters(): void {
        this._thereAreCollaborators = true;
        Establishments.collection.find({ creation_user: this._user }).fetch().forEach((est) => {
            let _collaborators: number = 0;
            _collaborators = UserDetails.collection.find({ establishment_work: est._id, role_id: '200' }).count();
            if (_collaborators === 0) {
                this._thereAreCollaborators = false;
            }
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
     * Get Establishment Points
     * @param {string} _pEstablishmentId 
     */
    getEstablishmentPoints(_pEstablishmentId: string): number {
        let _establishmentPoint: EstablishmentPoint = EstablishmentPoints.findOne({ establishment_id: _pEstablishmentId });
        if (_establishmentPoint) {
            return _establishmentPoint.current_points;
        } else {
            return 0;
        }
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}