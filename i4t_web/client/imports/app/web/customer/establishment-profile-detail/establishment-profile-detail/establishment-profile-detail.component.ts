import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Establishment, EstablishmentProfile, EstablishmentProfileImage } from '../../../../../../../both/models/establishment/establishment.model';
import { Establishments, EstablishmentsProfile } from '../../../../../../../both/collections/establishment/establishment.collection';
import { Country } from '../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../both/collections/general/country.collection';
import { City } from '../../../../../../../both/models/general/city.model';
import { Cities } from '../../../../../../../both/collections/general/city.collection';
import { Currency } from '../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../both/collections/general/currency.collection';
import { PaymentMethod } from '../../../../../../../both/models/general/paymentMethod.model';
import { PaymentMethods } from '../../../../../../../both/collections/general/paymentMethod.collection';
import { ScheduleDetailComponent } from '../schedule-detail/schedule-detail.component';
import { LightBoxComponent } from "../../../general/lightbox/lightbox.component";

@Component({
    selector: 'establishment-profile-detail',
    templateUrl: './establishment-profile-detail.component.html',
    styleUrls: ['./establishment-profile-detail.component.scss']
})
export class EstablishmentProFileDetailComponent implements OnInit, OnDestroy {

    private establishmentId: string;

    private _establishmentSub: Subscription;
    private _establishmentProfileSub: Subscription;
    private _countriesSub: Subscription;
    private _citiesSub: Subscription;
    private _currencySub: Subscription;
    private _paymentMethodSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishments: Observable<Establishment[]>;
    private _establishmentsProfile: Observable<EstablishmentProfile[]>;
    private _establishmentPaymentMethods: Observable<PaymentMethod[]>;

    private _establishmentCountry: string;
    private _establishmentCity: string;
    private _establishmentCurrency: string = '';
    public _dialogRef: MatDialogRef<any>;

    private _descriptionAux: string;
    private _showReadMore: boolean = true;
    private _showExtended: boolean = false;
    private _btnLabel: string;

    /**
     * EstablishmentProFileDetailComponent Constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService 
     * @param {ActivatedRoute} _activatedRoute
     * @param {Router} _router
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private readonly _location: Location,
        public _dialog: MatDialog) {
        if (Meteor.user() !== undefined && Meteor.user() !== null) {
            _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
            _translate.setDefaultLang('en');
        } else {
            _translate.use(navigator.language.split('-')[0]);
            _translate.setDefaultLang('en');
        }
        this._activatedRoute.params.forEach((params: Params) => {
            this.establishmentId = params['param1'];
        });
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this._location.replaceState("/app/establishment-detail");
        this.removeSubscriptions();
        if (this.establishmentId !== null && this.establishmentId !== undefined) {
            this._establishmentSub = MeteorObservable.subscribe('getEstablishmentById', this.establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
                this._ngZone.run(() => {
                    this._establishments = Establishments.find({ _id: this.establishmentId }).zone();
                    let _lEstablishment: Establishment = Establishments.findOne({ _id: this.establishmentId });
                    this._establishments.subscribe(() => {
                        _lEstablishment = Establishments.findOne({ _id: this.establishmentId });
                        if (_lEstablishment) {
                            this._countriesSub = MeteorObservable.subscribe('getCountryByEstablishmentId', this.establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
                                this._ngZone.run(() => {
                                    let _lCountry: Country = Countries.findOne({ _id: _lEstablishment.countryId });
                                    this._establishmentCountry = this.itemNameTraduction(_lCountry.name);
                                });
                            });
                            this._citiesSub = MeteorObservable.subscribe('getCityByEstablishmentId', this.establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
                                this._ngZone.run(() => {
                                    if (_lEstablishment.cityId === '') {
                                        this._establishmentCity = _lEstablishment.other_city;
                                    } else {
                                        let _lCity: City = Cities.findOne({ _id: _lEstablishment.cityId });
                                        this._establishmentCity = this.itemNameTraduction(_lCity.name);
                                    }
                                });
                            });
                            this._currencySub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', [this.establishmentId]).takeUntil(this._ngUnsubscribe).subscribe(() => {
                                this._ngZone.run(() => {
                                    let find: Currency = Currencies.findOne({ _id: _lEstablishment.currencyId });
                                    this._establishmentCurrency = find.code + ' - ' + this.itemNameTraduction(find.name);
                                });
                            });
                            this._paymentMethodSub = MeteorObservable.subscribe('getPaymentMethodsByEstablishmentId', this.establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
                                this._ngZone.run(() => {
                                    this._establishmentPaymentMethods = PaymentMethods.find({ _id: { $in: _lEstablishment.paymentMethods }, isActive: true }).zone();
                                });
                            });
                        }
                    });
                });
            });
            this._establishmentProfileSub = MeteorObservable.subscribe('getEstablishmentProfile', this.establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
                this._ngZone.run(() => {
                    this._establishmentsProfile = EstablishmentsProfile.find({ establishment_id: this.establishmentId }).zone();
                });
            });

            this._btnLabel = this.itemNameTraduction('RESTAURANT_PROFILE_DETAIL.READ_MORE');
        } else {
            if (Meteor.user() !== undefined && Meteor.user() !== null) {
                this._router.navigate(['/app/orders']);
            } else {
                // Redireccionar al catalogo de restaurantes si no hay usuario logueado
                this._router.navigate(['/app/orders']);
            }
        }
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Return web page url
     * @param {string} _pWebPage 
     */
    getWebPageUrl(_pWebPage: string): string {
        let _lLink: string = _pWebPage;
        let _lHttpPrefix = 'http://';
        let _lHttpsPrefix = 'https://';

        if (!_pWebPage.startsWith(_lHttpPrefix) && !_pWebPage.startsWith(_lHttpsPrefix)) {
            _lLink = _lHttpPrefix + _pWebPage
        }
        return _lLink;
    }

    /**
     * Open establishment schedule
     * @param {EstablishmentProfile} _pEstablishmentProfile 
     */
    openSchedule(_pEstablishmentProfile: EstablishmentProfile): void {
        this._dialogRef = this._dialog.open(ScheduleDetailComponent, {
            disableClose: true
        });
        this._dialogRef.componentInstance._establishmentSchedule = _pEstablishmentProfile;
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = null;
        });
    }

    /**
     * Open Facebook link
     * @param {string} _pFacebookLink 
     */
    openFacebookLink(_pFacebookLink: string): void {
        window.open(_pFacebookLink, "_blank");
    }

    /**
     * Open Twitter link
     * @param {string} _pTwitterLink 
     */
    openTwitterLink(_pTwitterLink: string): void {
        window.open(_pTwitterLink, "_blank");
    }

    /**
     * Open Instagram link
     * @param {string} _pInstagramLink 
     */
    openInstagramLink(_pInstagramLink: string): void {
        window.open(_pInstagramLink, "_blank");
    }

    /**
     * Return payment method image
     * @param {string} _pPaymentMethodName 
     */
    getPaymentMethodImg(_pPaymentMethodName: string): string {
        if (_pPaymentMethodName) {
            if (_pPaymentMethodName === 'PAYMENT_METHODS.CASH') {
                return '/images/cash-payment.png';
            } else if (_pPaymentMethodName === 'PAYMENT_METHODS.CREDIT_CARD') {
                return '/images/credit-card-payment.png';
            } else if (_pPaymentMethodName === 'PAYMENT_METHODS.DEBIT_CARD') {
                return '/images/debit-card-payment.png';
            } else if (_pPaymentMethodName === 'PAYMENT_METHODS.ONLINE') {
                return '/images/payment-online.png';
            }
        }
    }

    /**
     * Function to extend the establishment description
     */
    extendDescription() {
        if (this._showExtended) {
            this._btnLabel = this.itemNameTraduction('RESTAURANT_PROFILE_DETAIL.READ_MORE');
        } else {
            this._btnLabel = this.itemNameTraduction('RESTAURANT_PROFILE_DETAIL.READ_LESS');
        }
        this._showExtended = !this._showExtended;
    }

    /**
     * Function to translate information
     * @param {string} _itemName
     */
    itemNameTraduction(_itemName: string): string {
        var _wordTraduced: string;
        this._translate.get(_itemName).subscribe((res: string) => {
            _wordTraduced = res;
        });
        return _wordTraduced;
    }

    openLightBoxComponent(_pImages: EstablishmentProfileImage[], _pIndex: number) {
        this._dialogRef = this._dialog.open(LightBoxComponent, {
            disableClose: false,
            data: {
                images: _pImages,
                index: _pIndex
            }
        });
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}