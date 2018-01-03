import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { GoogleMaps, GoogleMap, GoogleMapsEvent, GoogleMapOptions, CameraPosition, MarkerOptions, Marker } from '@ionic-native/google-maps';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, ModalController, LoadingController, ToastController } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { Observable, Subscription } from 'rxjs';
import { Country } from 'i4t_web/both/models/general/country.model';
import { Countries } from 'i4t_web/both/collections/general/country.collection';
import { City } from 'i4t_web/both/models/general/city.model';
import { Cities } from 'i4t_web/both/collections/general/city.collection';
import { PaymentMethod } from 'i4t_web/both/models/general/paymentMethod.model';
import { PaymentMethods } from 'i4t_web/both/collections/general/paymentMethod.collection';
import { Restaurant, RestaurantProfile, RestaurantProfileImage } from 'i4t_web/both/models/restaurant/restaurant.model';
import { Restaurants, RestaurantsProfile } from 'i4t_web/both/collections/restaurant/restaurant.collection';
import { ModalSchedule } from './modal-schedule/modal-schedule';

@Component({
    selector: 'page-restaurant-profile',
    templateUrl: 'restaurant-profile.html'
})
export class RestaurantProfilePage implements OnInit, OnDestroy {

    private _map: GoogleMap;
    private _restaurantSubscription: Subscription;
    private _countriesSubscription: Subscription;
    private _citiesSubscription: Subscription;
    private _restaurantProfileSubscription: Subscription;
    private _paymentMethodsSubscription: Subscription;

    private _restaurantsProfiles: Observable<RestaurantProfile[]>;
    private _paymentMethods: Observable<PaymentMethod[]>;
    private _restaurants: Observable<Restaurant[]> = null;
    private _restaurantParam: Restaurant = null;
    private _restaurantProfile: RestaurantProfile = null;

    private _restaurantCountry: string;
    private _restaurantCity: string;
    private _showDescription: boolean = false;
    private _profileImgs: RestaurantProfileImage[] = [];


    /**
     * Constructor implementation
     * @param _navParams 
     * @param _translate 
     * @param googleMaps 
     * @param _ngZone 
     */
    constructor(public _navParams: NavParams,
        public _translate: TranslateService,
        public _modalCtrl: ModalController,
        private googleMaps: GoogleMaps,
        private _ngZone: NgZone) {
        this._restaurantParam = this._navParams.get("restaurant");
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSuscriptions();
        this._restaurantSubscription = MeteorObservable.subscribe('getRestaurantById', this._restaurantParam._id).subscribe(() => {
            this._ngZone.run(() => {
                this._restaurants = Restaurants.find({ _id: this._restaurantParam._id }).zone();
                this._restaurants.subscribe(() => {
                    let restaurant = Restaurants.findOne({ _id: this._restaurantParam._id });
                    this._paymentMethodsSubscription = MeteorObservable.subscribe('getPaymentMethodsByrestaurantId', restaurant._id).subscribe(() => {
                        this._paymentMethods = PaymentMethods.find({ _id: { $in: restaurant.paymentMethods }, isActive: true }).zone();
                    });
                });
            });
        });

        this._countriesSubscription = MeteorObservable.subscribe('getCountryByRestaurantId', this._restaurantParam._id).subscribe(() => {
            this._ngZone.run(() => {
                let _lCountry: Country = Countries.findOne({ _id: this._restaurantParam.countryId });
                this._restaurantCountry = this.itemNameTraduction(_lCountry.name);
            });
        });

        this._citiesSubscription = MeteorObservable.subscribe('getCityByRestaurantId', this._restaurantParam._id).subscribe(() => {
            this._ngZone.run(() => {
                let _lCity: City = Cities.findOne({ _id: this._restaurantParam.cityId });
                this._restaurantCity = this.itemNameTraduction(_lCity.name);
            });
        });

        this._restaurantProfileSubscription = MeteorObservable.subscribe('getRestaurantProfile', this._restaurantParam._id).subscribe(() => {
            this._ngZone.run(() => {
                this._restaurantsProfiles = RestaurantsProfile.find({ restaurant_id: this._restaurantParam._id }).zone();
                this._restaurantProfile = RestaurantsProfile.findOne({ restaurant_id: this._restaurantParam._id });
                this.loadMap();
            });
        });
    }

    /**
     * Function to translate information
     * @param {string} _itemName
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * Load map whit restaurant location
     */
    loadMap() {
        if (this._restaurantProfile.location.lat && this._restaurantProfile.location.lng) {

            let mapOptions: GoogleMapOptions = {
                camera: {
                    target: {
                        lat: this._restaurantProfile.location.lat,
                        lng: this._restaurantProfile.location.lng
                    },
                    zoom: 18,
                    tilt: 30
                }
            };
            this._map = GoogleMaps.create('map_canvas', mapOptions);
            this._map.one(GoogleMapsEvent.MAP_READY).then(() => {
                this._map.addMarker({
                    title: this._restaurantParam.name,
                    icon: 'red',
                    animation: 'DROP',
                    position: {
                        lat: this._restaurantProfile.location.lat,
                        lng: this._restaurantProfile.location.lng
                    }
                })
            });
        }
    }

    /**
     * 
     */
    showInformation() {
        this._showDescription = !this._showDescription;
    }

    /**
     * Open password change modal
     */
    openSchedule() {
        let contactModal = this._modalCtrl.create(ModalSchedule, {
            restaurant: this._restaurantParam
        });
        contactModal.present();
    }

    /**
     * Remove all suscriptions
     */
    removeSuscriptions(): void {
        if (this._restaurantSubscription) { this._restaurantSubscription };
        if (this._countriesSubscription) { this._countriesSubscription };
        if (this._citiesSubscription) { this._citiesSubscription };
        if (this._restaurantProfileSubscription) { this._restaurantProfileSubscription };
        if (this._paymentMethodsSubscription) { this._paymentMethodsSubscription };
    }

    /**
     * ngOndestroy implementation
     */
    ngOnDestroy() {
        this.removeSuscriptions();
    }
}