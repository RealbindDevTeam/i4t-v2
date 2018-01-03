import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../../services/general/user-language.service';
import { Restaurant } from '../../../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../../../../both/collections/restaurant/restaurant.collection';
import { Parameter } from '../../../../../../../../../both/models/general/parameter.model';

@Component({
    selector: 'monthly-config',
    templateUrl: './monthly-config.component.html',
    styleUrls: [ './monthly-config.component.scss' ]
})
export class MonthlyConfigComponent implements OnInit, OnDestroy {

    private _restaurants            : Observable<Restaurant[]>;
    private _restaurantSub          : Subscription;
    private _showRestaurantList     : boolean = false;
    private _showEnableDisable      : boolean = false;
    private _restaurantId           : string = "";
    private _thereAreRestaurants    : boolean = true;

    /**
     * MonthlyConfigComponent Constructor
     * @param {TranslateService} translate 
     * @param {Router} _router 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor( private translate: TranslateService, 
                 private _router: Router, 
                 private _userLanguageService: UserLanguageService,
                 private _ngZone: NgZone ) {
        translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
        translate.setDefaultLang( 'en' );
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._restaurantSub = MeteorObservable.subscribe('restaurants', Meteor.userId()).subscribe(() => {
            this._ngZone.run( () => {
                this._restaurants = Restaurants.find({}).zone();
                this.countRestaurants();
                this._restaurants.subscribe( () => { this.countRestaurants(); } );
                if (this._restaurants) {
                    this._showRestaurantList = true;
                }
            });
        });
    }

    /**
     * Validate if restaurants exists
     */
    countRestaurants():void{
        Restaurants.collection.find( { } ).count() > 0 ? this._thereAreRestaurants = true : this._thereAreRestaurants = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions():void{
        if( this._restaurantSub ){ this._restaurantSub.unsubscribe(); }
    }

    /**
     * This function go to enable disable component
     * @param {$event} event
     */
    goToEnableDisable(event) {
        this._restaurantId = event;
        this._showEnableDisable = true;
        this._showRestaurantList = false;
    }

    /**
     * This function go torestaurant list component
     * @param {$event} event
     */
    goToRestaurantList(event) {
        this._showEnableDisable = false;
        this._showRestaurantList = event;
    }

    goToAddRestaurant(){
        this._router.navigate(['/app/restaurant-register']);
    }

    ngOnDestroy() {
        this.removeSubscriptions();
    }
}