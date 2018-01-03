import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from "@angular/router";
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Restaurant } from '../../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../../../both/collections/restaurant/restaurant.collection';
import { Country } from '../../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../../both/collections/general/country.collection';
import { City } from '../../../../../../../../both/models/general/city.model';
import { Cities } from '../../../../../../../../both/collections/general/city.collection';

@Component({
    selector: 'restaurant',
    templateUrl: './restaurant.component.html',
    styleUrls: ['./restaurant.component.scss']
})
export class RestaurantComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private restaurants: Observable<Restaurant[]>;

    private restaurantSub: Subscription;
    private countriesSub: Subscription;
    private citiesSub: Subscription;

    public _dialogRef: MatDialogRef<any>;
    private _thereAreRestaurants: boolean = true;

    /**
     * RestaurantComponent Constructor
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
        this.restaurantSub = MeteorObservable.subscribe('restaurants', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this.restaurants = Restaurants.find({ creation_user: this._user }).zone();
                this.countRestaurants();
                this.restaurants.subscribe(() => { this.countRestaurants(); });
            });
        });
        this.countriesSub = MeteorObservable.subscribe('countries').subscribe();
        this.citiesSub = MeteorObservable.subscribe('cities').subscribe();
    }

    /**
     * Validate if restaurants exists
     */
    countRestaurants(): void {
        Restaurants.collection.find({ creation_user: this._user }).count() > 0 ? this._thereAreRestaurants = true : this._thereAreRestaurants = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this.restaurantSub) { this.restaurantSub.unsubscribe(); }
        if (this.countriesSub) { this.countriesSub.unsubscribe(); }
        if (this.citiesSub) { this.citiesSub.unsubscribe(); }
    }

    /**
     * Function to open RestaurantRegisterComponent
     */
    openRestaurantRegister() {
        this.router.navigate(['app/restaurant-register']);
    }

    /**
     * Function to open RestaurantEditionComponent
     * @param {Restaurant} _restaurant 
     */
    openRestaurantEdition(_restaurant: Restaurant) {
        this.router.navigate(['app/restaurant-edition', JSON.stringify(_restaurant)], { skipLocationChange: true });
    }

    /**
     * Get Restaurant Country
     * @param {string} _pCountryId
     */
    getRestaurantCountry(_pCountryId: string): string {
        let _lCountry: Country = Countries.findOne({ _id: _pCountryId });
        if (_lCountry) {
            return _lCountry.name;
        }
    }

    /**
     * Get Restaurant City
     * @param {string} _pCityId 
     * @param {string} _pOtherCity
     */
    getRestaurantCity(_pCityId: string, _pOtherCity: string): string {
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