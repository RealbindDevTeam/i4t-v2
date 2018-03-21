import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { GoogleMaps, GoogleMap, GoogleMapsEvent, GoogleMapOptions, CameraPosition, MarkerOptions, Marker } from '@ionic-native/google-maps';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, ModalController, LoadingController, ToastController, AlertController, Platform } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { Observable, Subscription, Subject } from 'rxjs';
import { Country } from 'i4t_web/both/models/general/country.model';
import { Countries } from 'i4t_web/both/collections/general/country.collection';
import { City } from 'i4t_web/both/models/general/city.model';
import { Cities } from 'i4t_web/both/collections/general/city.collection';
import { PaymentMethod } from 'i4t_web/both/models/general/paymentMethod.model';
import { PaymentMethods } from 'i4t_web/both/collections/general/paymentMethod.collection';
import { Establishment, EstablishmentProfile, EstablishmentProfileImage } from 'i4t_web/both/models/establishment/establishment.model';
import { Establishments, EstablishmentsProfile } from 'i4t_web/both/collections/establishment/establishment.collection';
import { ModalSchedule } from './modal-schedule/modal-schedule';
import { TypeOfFood } from 'i4t_web/both/models/general/type-of-food.model';
import { TypesOfFood } from 'i4t_web/both/collections/general/type-of-food.collection';
import { Network } from '@ionic-native/network';

@Component({
    selector: 'page-establishment-profile',
    templateUrl: 'establishment-profile.html'
})
export class EstablishmentProfilePage implements OnInit, OnDestroy {

    private _map: GoogleMap;
    private _establishmentSubscription: Subscription;
    private _countriesSubscription: Subscription;
    private _citiesSubscription: Subscription;
    private _establishmentProfileSubscription: Subscription;
    private _paymentMethodsSubscription: Subscription;
    private _typesOfFoodSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishmentsProfiles: Observable<EstablishmentProfile[]>;
    private _typesOfFood: Observable<TypeOfFood[]>;
    private _paymentMethods: Observable<PaymentMethod[]>;
    private _establishments: Observable<Establishment[]> = null;
    private _establishmentParam: Establishment = null;
    private _establishmentProfile: EstablishmentProfile = null;

    private _establishmentCountry: string = '';
    private _establishmentCity: string = '';
    private _showDescription: boolean = false;
    private _profileImgs: EstablishmentProfileImage[] = [];

    private disconnectSubscription: Subscription;

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
        private _ngZone: NgZone,
        public _alertCtrl: AlertController,
        public _platform: Platform,
        private _network: Network) {
        this._establishmentParam = this._navParams.get("establishment");
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSuscriptions();
        this._establishmentSubscription = MeteorObservable.subscribe('getEstablishmentById', this._establishmentParam._id).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ _id: this._establishmentParam._id }).zone();
                this._establishments.subscribe(() => {
                    let establishment = Establishments.findOne({ _id: this._establishmentParam._id });
                    this._paymentMethodsSubscription = MeteorObservable.subscribe('getPaymentMethodsByEstablishmentId', establishment._id).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._paymentMethods = PaymentMethods.find({ _id: { $in: establishment.paymentMethods }, isActive: true }).zone();
                    });
                });
            });
        });

        this._countriesSubscription = MeteorObservable.subscribe('getCountryByEstablishmentId', this._establishmentParam._id).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let _lCountry: Country = Countries.findOne({ _id: this._establishmentParam.countryId });
                if (_lCountry) {
                    this._establishmentCountry = this.itemNameTraduction(_lCountry.name);
                }
            });
        });

        this._citiesSubscription = MeteorObservable.subscribe('getCityByEstablishmentId', this._establishmentParam._id).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let _lCity: City = Cities.findOne({ _id: this._establishmentParam.cityId });
                if (_lCity) {
                    this._establishmentCity = this.itemNameTraduction(_lCity.name);
                }
            });
        });

        this._establishmentProfileSubscription = MeteorObservable.subscribe('getEstablishmentProfile', this._establishmentParam._id).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishmentsProfiles = EstablishmentsProfile.find({ establishment_id: this._establishmentParam._id }).zone();
                this.verifyEstablishmentProfile();
                this._establishmentsProfiles.subscribe(() => { this.verifyEstablishmentProfile(); });
                this._establishmentProfile = EstablishmentsProfile.findOne({ establishment_id: this._establishmentParam._id });
                if (this._establishmentProfile) {
                    this.loadMap();
                }
            });
        });

        this._typesOfFoodSub = MeteorObservable.subscribe('typesOfFood').takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._typesOfFood = TypesOfFood.find({}).zone();
            });
        });
    }

    /**
     * Verify establishment profile changes
     */
    verifyEstablishmentProfile(): void {
        this._establishmentProfile = EstablishmentsProfile.findOne({ establishment_id: this._establishmentParam._id });
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
     * Load map whit establishment location
     */
    loadMap() {
        if (this._establishmentProfile && this._establishmentProfile.location && this._establishmentProfile.location.lat && this._establishmentProfile.location.lng) {

            let mapOptions: GoogleMapOptions = {
                camera: {
                    target: {
                        lat: this._establishmentProfile.location.lat,
                        lng: this._establishmentProfile.location.lng
                    },
                    zoom: 18,
                    tilt: 30
                }
            };
            this._map = GoogleMaps.create('map_canvas', mapOptions);
            this._map.one(GoogleMapsEvent.MAP_READY).then(() => {
                this._map.addMarker({
                    title: this._establishmentParam.name,
                    icon: 'red',
                    animation: 'DROP',
                    position: {
                        lat: this._establishmentProfile.location.lat,
                        lng: this._establishmentProfile.location.lng
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
            establishment: this._establishmentParam
        });
        contactModal.present();
    }

    /**
     * Remove all suscriptions
     */
    removeSuscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /** 
         * This function verify the conditions on page did enter for internet and server connection
        */
    ionViewDidEnter() {
        this.isConnected();
        this.disconnectSubscription = this._network.onDisconnect().subscribe(data => {
            let title = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.TITLE');
            let subtitle = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.SUBTITLE');
            let btn = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.BTN');
            this.presentAlert(title, subtitle, btn);
        }, error => console.error(error));
    }

    /** 
     * This function verify with network plugin if device has internet connection
    */
    isConnected() {
        if (this._platform.is('cordova')) {
            let conntype = this._network.type;
            let validateConn = conntype && conntype !== 'unknown' && conntype !== 'none';
            if (!validateConn) {
                let title = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.TITLE');
                let subtitle = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.SUBTITLE');
                let btn = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.BTN');
                this.presentAlert(title, subtitle, btn);
            } else {
                if (!Meteor.status().connected) {
                    let title2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.TITLE');
                    let subtitle2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.SUBTITLE');
                    let btn2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.BTN');
                    this.presentAlert(title2, subtitle2, btn2);
                }
            }
        }
    }

    /**
     * Present the alert for advice to internet
    */
    presentAlert(_pTitle: string, _pSubtitle: string, _pBtn: string) {
        let alert = this._alertCtrl.create({
            title: _pTitle,
            subTitle: _pSubtitle,
            enableBackdropDismiss: false,
            buttons: [
                {
                    text: _pBtn,
                    handler: () => {
                        this.isConnected();
                    }
                }
            ]
        });
        alert.present();
    }

    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
    }

    /**
     * ngOndestroy implementation
     */
    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}