import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { App, AlertController, LoadingController, NavController, NavParams } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { WaiterCallPage } from '../waiter-call/waiter-call';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { WaiterCallDetails } from 'i4t_web/both/collections/restaurant/waiter-call-detail.collection';

import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { ChangeTablePage } from './table-change/table-change';
import { RestaurantExitPage } from './restaurant-exit/restaurant-exit';

@Component({
  selector: 'page-options',
  templateUrl: 'options.html'
})
export class OptionsPage implements OnInit, OnDestroy {

  private _userDetailSubscription: Subscription;
  private _waiterCallDetailSubscription: Subscription;
  private _userName: string;
  private _userDetail: any;
  private _waiterCallsDetails: any;
  private _showWaiterAlert: boolean = false;

  /**
   * OptionsPage constructor
   * @param _navCtrl 
   * @param _navParams 
   * @param _app 
   * @param _alertCtrl 
   * @param _loadingCtrl 
   * @param _translate 
   * @param _userLanguageService 
   */
  constructor( public _navCtrl: NavController,
               public _navParams: NavParams,
               public _app: App,
               public _alertCtrl: AlertController,
               public _loadingCtrl: LoadingController,
               private _ngZone: NgZone,
               private _translate: TranslateService,
               private _userLanguageService: UserLanguageServiceProvider ) {
    _translate.setDefaultLang('en');
  }

  /**
   * ngOnInit implementation
   */
  ngOnInit() {
    this.init();
  }

  /**
   * ionViewWillEnter implementation
   */
  ionViewWillEnter() {
    this.init();
  }

  init() {
    this.removeSubscriptions();
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).subscribe( () => {
      this._ngZone.run( () => {
        this._userDetail = UserDetails.findOne( { user_id: Meteor.userId() } );
      });
    });
    this._waiterCallDetailSubscription = MeteorObservable.subscribe('countWaiterCallDetailByUsrId', Meteor.userId()).subscribe( () => {
      this._ngZone.run( () => {
        this._waiterCallsDetails = WaiterCallDetails.find( { user_id : Meteor.userId(), type: 'CALL_OF_CUSTOMER', restaurant_id: this._userDetail.current_restaurant, status : { $in : ["waiting", "completed"] } } ).zone();
        this.countWaiterCalls(); 
        this._waiterCallsDetails.subscribe( () => { this.countWaiterCalls(); } );
      });
    });
  }

  /**
   * Count Waiter Calls
   */
  countWaiterCalls():void{
    let _lWaiterCalls:number = WaiterCallDetails.collection.find( { user_id : Meteor.userId(), type: 'CALL_OF_CUSTOMER', restaurant_id: this._userDetail.current_restaurant, status : { $in : ["waiting", "completed"] } } ).count();    
    _lWaiterCalls > 0 ? this._showWaiterAlert = true : this._showWaiterAlert = false;
  }

  /**
   * This method is responsible for go to payments history option
   */
  goToWaiterCall() {
    //this._navCtrl = this._app.getRootNav();
    this._navCtrl.push(WaiterCallPage);
  }

  /**
   * This method go to change table 
   */
  goToChangeTable() {
    //let userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
    this._navCtrl.push(ChangeTablePage, { res_id: this._userDetail.current_restaurant, table_id: this._userDetail.current_table });
  }

  /**
  * This method go to restaurant exit
  */
  goToRestaurantExit() {
    //let userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
    this._navCtrl.push(RestaurantExitPage, { res_id: this._userDetail.current_restaurant, table_id: this._userDetail.current_table });
  }

  /**
   * This function allow translate strings
   * @param {string} _itemName 
   */
  itemNameTraduction(_itemName: string): string {
    var wordTraduced: string;
    this._translate.get(_itemName).subscribe((res: string) => {
      wordTraduced = res;
    });
    return wordTraduced;
  }

  /**
   * ionViewWillLeave implementation
   */
  ionViewWillLeave() {
    this.removeSubscriptions();
  }

  /**
   * ngOnDestroy Implementation
   */
  ngOnDestroy() {
    this.removeSubscriptions();
  }

  /**
   * Remove all subscription
   */
  removeSubscriptions() {
    if( this._userDetailSubscription ){ this._userDetailSubscription.unsubscribe(); }
    if( this._waiterCallDetailSubscription ){ this._waiterCallDetailSubscription.unsubscribe(); }
  }

}
