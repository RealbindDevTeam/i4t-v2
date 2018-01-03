import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs'
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Payments } from 'i4t_web/both/collections/restaurant/payment.collection';
import { UserLanguageServiceProvider } from '../../../../../../providers/user-language-service/user-language-service';

/*
  Generated class for the ColombiaPayInfoPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'colombia-pay-info',
  templateUrl: 'colombia-pay-info.html'
})

export class ColombiaPayInfoPage implements OnInit, OnDestroy {
    
  private _paymentsSubscription : Subscription;
  private _payments             : any;
  private _restaurantId         : string;
  private _tableId              : string;
  private _currency             : string;

  /**
   * ColombiaPayInfoPage constructor
   * @param _navParams 
   * @param _navCtrl 
   * @param _translate 
   * @param _userLanguageService 
   */
  constructor( public _navParams : NavParams,
               public _navCtrl   : NavController,
               public _translate   : TranslateService,
               private _userLanguageService: UserLanguageServiceProvider ){
    _translate.setDefaultLang('en');
    this._restaurantId = this._navParams.get("restaurant");
    this._tableId      = this._navParams.get("table");
    this._currency     = this._navParams.get("currency");
  }

  /**
   * ngOnInit implementation
   */
  ngOnInit(){
    this._translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
    this.removeSubscriptions();
    this._paymentsSubscription = MeteorObservable.subscribe( 'getUserPaymentsByRestaurantAndTable', Meteor.userId(), this._restaurantId, this._tableId, ['PAYMENT.NO_PAID', 'PAYMENT.PAID'] ).subscribe( () => {
        this._payments = Payments.find({});
    });
  }

  /**
   * ngOnDestroy implementation
   */
  ngOnDestroy(){
   this.removeSubscriptions();
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions():void{
    if( this._paymentsSubscription ){ this._paymentsSubscription.unsubscribe(); }
  }

}