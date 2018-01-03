import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs'
import { Subscription } from 'rxjs';
import { Addition } from 'i4t_web/both/models/menu/addition.model';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Orders } from 'i4t_web/both/collections/restaurant/order.collection';
import { GarnishFood } from 'i4t_web/both/models/menu/garnish-food.model';
import { GarnishFoodCol } from 'i4t_web/both/collections/menu/garnish-food.collection';
import { Restaurants } from 'i4t_web/both/collections/restaurant/restaurant.collection';

/*
  Generated class for the OrderDetailPayInfo Page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'order-detail-pay-info',
  templateUrl: 'order-detail-pay-info.html'
})

export class OrderDetailPayInfoPage implements OnInit, OnDestroy {

  @Input() orderId      : string
  @Input() restaurantId : string
  @Input() currency     : string
  private _ordersSubscription      : Subscription;
  private _additionsSubscription   : Subscription;
  private _garnishFoodSubscription : Subscription;
  private _restaurantSubscription  : Subscription;
  private _currencyId  : string;
  private _order      : any;
  private _additions   : any;
  private _garnishFood : any;

  constructor(private _ngZone : NgZone){
  }

  ngOnInit(){
    this.removeSubscriptions();
    this._ordersSubscription = MeteorObservable.subscribe( 'getOrderById', this.orderId ).subscribe(()=>{
      this._ngZone.run(()=>{
        this._order = Orders.findOne({_id : this.orderId});
      });
    });
    this._additionsSubscription = MeteorObservable.subscribe( 'additionsByRestaurant', this.restaurantId ).subscribe( () => {
      this._additions = Additions.find({});
    });
    this._garnishFoodSubscription = MeteorObservable.subscribe( 'garnishFoodByRestaurant', this.restaurantId ).subscribe( () => {
      this._garnishFood = GarnishFoodCol.find({});
    });
    this._restaurantSubscription = MeteorObservable.subscribe( 'getRestaurantByCurrentUser', Meteor.userId() ).subscribe( () => {
      let _lRestaurant = Restaurants.collection.find( { _id: this.restaurantId } ).fetch()[0];
      this._currencyId = _lRestaurant.currencyId;
    });
  }

  /**
   * Return Unit garnish food price
   * @param {GarnishFood} _pGarnishFood
   */
  getGarnisFoodUnitPrice( _pGarnishFood : GarnishFood ): number {
    if(this._currencyId){
      return _pGarnishFood.prices.filter( g  => g.currencyId === this._currencyId )[0].price;
    } else {
      return 0;
    }
  }

  /**
   * Return Total Garnish Food Price
   */
  getGarnishFoodTotalPrice( _pGarnishFood: GarnishFood, _pOrderItemQuantity : number ): number {
    return _pGarnishFood.restaurants.filter( g  => g.restaurantId === this.restaurantId )[0].price * _pOrderItemQuantity;
  }

  /**
   * Return Unit addition price
   * @param {Addition} _pAddition 
   */
  getAdditionUnitPrice( _pAddition: Addition ): number {
    if(this._currencyId){
      return _pAddition.prices.filter( a => a.currencyId === this._currencyId )[0].price;
    } else {
      return 0;
    }
  }

  /**
   * Return Total addition Price
   * @param {Addition} _pAddition 
   */
  getAdditionTotalPrice( _pAddition: Addition, _pOrderItemQuantity:number ): number {
    return _pAddition.restaurants.filter( a => a.restaurantId === this.restaurantId )[0].price * _pOrderItemQuantity;
  }

  ngOnDestroy(){
    this.removeSubscriptions();
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions():void{
    if( this._ordersSubscription ){ this._ordersSubscription.unsubscribe(); }
    if( this._additionsSubscription ){ this._additionsSubscription.unsubscribe(); }
    if( this._garnishFoodSubscription ){ this._garnishFoodSubscription.unsubscribe(); }
    if( this._restaurantSubscription ){ this._restaurantSubscription.unsubscribe(); }
  }

}