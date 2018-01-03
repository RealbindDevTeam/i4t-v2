import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Restaurant, RestaurantProfile, RestaurantProfileImage } from '../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants, RestaurantsProfile } from '../../../../../../../both/collections/restaurant/restaurant.collection';
import { Country } from '../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../both/collections/general/country.collection';
import { City } from '../../../../../../../both/models/general/city.model';
import { Cities } from '../../../../../../../both/collections/general/city.collection';
import { Currency } from '../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../both/collections/general/currency.collection';
import { PaymentMethod } from '../../../../../../../both/models/general/paymentMethod.model';
import { PaymentMethods } from '../../../../../../../both/collections/general/paymentMethod.collection';
import { ScheduleDetailComponent } from '../schedule-detail/schedule-detail.component';

@Component({
    selector: 'restaurant-profile-detail',
    templateUrl: './restaurant-profile-detail.component.html',
    styleUrls: ['./restaurant-profile-detail.component.scss']
})
export class RestaurantProFileDetailComponent implements OnInit, OnDestroy {

    private restaurantId: string;

    private _restaurantSub: Subscription;
    private _restaurantProfileSub: Subscription;
    private _countriesSub: Subscription;
    private _citiesSub: Subscription;
    private _currencySub: Subscription;
    private _paymentMethodSub: Subscription;

    private _restaurants: Observable<Restaurant[]>;;
    private _restaurantsProfile: Observable<RestaurantProfile[]>;
    private _restaurantPaymentMethods: Observable<PaymentMethod[]>;

    private _restaurantCountry: string;
    private _restaurantCity: string;
    private _restaurantCurrency: string = '';
    public _dialogRef: MatDialogRef<any>;

    private _descriptionAux: string;
    private _showReadMore: boolean = true;
    private _showExtended: boolean = false;
    private _btnLabel: string;

    /**
     * RestaurantProFileDetailComponent Constructor
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
            this.restaurantId = params['param1'];
        });
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this._location.replaceState("/app/restaurant-detail");
        this.removeSubscriptions();
        if (this.restaurantId !== null && this.restaurantId !== undefined) {
            this._restaurantSub = MeteorObservable.subscribe('getRestaurantById', this.restaurantId).subscribe(() => {
                this._ngZone.run(() => {
                    this._restaurants = Restaurants.find({ _id: this.restaurantId }).zone();
                    let _lRestaurant: Restaurant = Restaurants.findOne({ _id: this.restaurantId });
                    this._restaurants.subscribe(() => {
                        _lRestaurant = Restaurants.findOne({ _id: this.restaurantId });
                        if (_lRestaurant) {
                            this._countriesSub = MeteorObservable.subscribe('getCountryByRestaurantId', this.restaurantId).subscribe(() => {
                                this._ngZone.run(() => {
                                    let _lCountry: Country = Countries.findOne({ _id: _lRestaurant.countryId });
                                    this._restaurantCountry = this.itemNameTraduction(_lCountry.name);
                                });
                            });
                            this._citiesSub = MeteorObservable.subscribe('getCityByRestaurantId', this.restaurantId).subscribe(() => {
                                this._ngZone.run(() => {
                                    if (_lRestaurant.cityId === '') {
                                        this._restaurantCity = _lRestaurant.other_city;
                                    } else {
                                        let _lCity: City = Cities.findOne({ _id: _lRestaurant.cityId });
                                        this._restaurantCity = this.itemNameTraduction(_lCity.name);
                                    }
                                });
                            });
                            this._currencySub = MeteorObservable.subscribe('getCurrenciesByRestaurantsId', [this.restaurantId]).subscribe(() => {
                                this._ngZone.run(() => {
                                    let find: Currency = Currencies.findOne({ _id: _lRestaurant.currencyId });
                                    this._restaurantCurrency = find.code + ' - ' + this.itemNameTraduction(find.name);
                                });
                            });
                            this._paymentMethodSub = MeteorObservable.subscribe('getPaymentMethodsByrestaurantId', this.restaurantId).subscribe(() => {
                                this._ngZone.run(() => {
                                    this._restaurantPaymentMethods = PaymentMethods.find({ _id: { $in: _lRestaurant.paymentMethods }, isActive: true }).zone();
                                });
                            });
                        }
                    });
                });
            });
            this._restaurantProfileSub = MeteorObservable.subscribe('getRestaurantProfile', this.restaurantId).subscribe(() => {
                this._ngZone.run(() => {
                    this._restaurantsProfile = RestaurantsProfile.find({ restaurant_id: this.restaurantId }).zone();
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
        if (this._restaurantSub) { this._restaurantSub.unsubscribe(); }
        if (this._restaurantProfileSub) { this._restaurantProfileSub.unsubscribe(); }
        if (this._countriesSub) { this._countriesSub.unsubscribe(); }
        if (this._citiesSub) { this._citiesSub.unsubscribe(); }
        if (this._currencySub) { this._currencySub.unsubscribe(); }
        if (this._paymentMethodSub) { this._paymentMethodSub.unsubscribe(); }
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
     * Open restaurant schedule
     * @param {RestaurantProfile} _pRestaurantProfile 
     */
    openSchedule(_pRestaurantProfile: RestaurantProfile): void {
        this._dialogRef = this._dialog.open(ScheduleDetailComponent, {
            disableClose: true
        });
        this._dialogRef.componentInstance._restaurantSchedule = _pRestaurantProfile;
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
     * Function to extend the restaurant description
     */
    extendDescription() {
        if(this._showExtended){
            this._btnLabel = this.itemNameTraduction('RESTAURANT_PROFILE_DETAIL.READ_MORE');
        }else {
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

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}