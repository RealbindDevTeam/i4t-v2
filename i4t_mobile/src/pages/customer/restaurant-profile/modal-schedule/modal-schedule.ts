import { Component, OnInit, NgZone } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { Observable } from 'rxjs';
import { Restaurant, RestaurantProfile } from 'i4t_web/both/models/restaurant/restaurant.model';
import { Restaurants, RestaurantsProfile } from 'i4t_web/both/collections/restaurant/restaurant.collection';

@Component({
  selector: 'modal-schedule',
  templateUrl: './modal-schedule.html'
})
export class ModalSchedule implements OnInit {

    private _restaurantsProfiles               : Observable<RestaurantProfile[]>;;
    private _restaurantsProfile                : RestaurantProfile;
    private _restaurant                        : Restaurant = null;

    /**
     * ModalSchedule constructor
     * @param _navParams 
     * @param _viewCtrl 
     * @param _ngZone 
     */
    constructor( public _navParams: NavParams,
                 public _viewCtrl : ViewController,
                 private _ngZone: NgZone ) {
        this._restaurant = this._navParams.get("restaurant");
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit(){
        this._ngZone.run( () => {
            this._restaurantsProfiles = RestaurantsProfile.find( { restaurant_id: this._restaurant._id } ).zone();
            this._restaurantsProfiles.subscribe(() => {
                this._restaurantsProfile = RestaurantsProfile.findOne( { restaurant_id: this._restaurant._id } );
            });
        });
    }

    /**
     * Close the modal
     */
    close(){
        this._viewCtrl.dismiss();
    }

}