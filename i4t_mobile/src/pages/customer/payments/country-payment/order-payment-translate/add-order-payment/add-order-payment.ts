import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, LoadingController, NavParams, ToastController } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs'
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Orders } from 'i4t_web/both/collections/restaurant/order.collection';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { UserLanguageServiceProvider } from '../../../../../../providers/user-language-service/user-language-service';

/*
  Generated class for the AddOrderPayment page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'add-order-payment-page',
  templateUrl: 'add-order-payment.html'
})

export class AddOrderPaymentPage implements OnInit, OnDestroy {
    
  private _ordersSubscription           : Subscription;
  private _itemsSubscription            : Subscription;
  private _ordersTable   : any;
  private _items         : any;
  private _restaurantId  : string;
  private _tableId       : string;
  private _currency      : string;
  private _currentUserId : string;
  private _orderIndex    : number = -1;

  /**
   * AddOrderPaymentPage constructor
   * @param _navParams 
   * @param _alertCtrl 
   * @param _translate 
   * @param _loadingCtrl 
   * @param _toastCtrl 
   * @param _userLanguageService 
   */
  constructor(public _navParams   : NavParams,
              public _alertCtrl   : AlertController,
              public _translate   : TranslateService,
              public _loadingCtrl : LoadingController,
              private _toastCtrl  : ToastController,
              private _userLanguageService: UserLanguageServiceProvider) {
    _translate.setDefaultLang('en');
    this._restaurantId = this._navParams.get("restaurant");
    this._tableId      = this._navParams.get("table");
    this._currency     = this._navParams.get("currency");
    this._currentUserId = Meteor.userId();
  }

  /**
   * ngOnInit Implementation. Find table to payment
   */
  ngOnInit(){
    this._translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
    this.removeSubscriptions();
    this._ordersSubscription = MeteorObservable.subscribe( 'getOrdersByTableId', this._restaurantId, this._tableId,[ 'ORDER_STATUS.DELIVERED' ] ).subscribe( () => {
      this._ordersTable = Orders.find( { creation_user: { $not: Meteor.userId() }, status: 'ORDER_STATUS.DELIVERED', 'translateInfo.lastOrderOwner': '',
                                         'translateInfo.markedToTranslate': false, 'translateInfo.confirmedToTranslate': false, toPay : false } ).zone();
    });

    this._itemsSubscription = MeteorObservable.subscribe( 'itemsByRestaurant', this._restaurantId ).subscribe( () => {
      this._items = Items.find( { } ).zone();
    });
  }

  /**
   * Allow view Order detail
   * @param i 
   */
  showDetail(i) {
    if (this._orderIndex == i) {
      this._orderIndex = -1;
    } else {
      this._orderIndex = i;
    }
  }

  /**
   * Show modal confirm
   * @param _pOrder 
   */
  showConfirm( _pOrder: any ):void{

    let btn_no  = this.itemNameTraduction('MOBILE.ORDERS.NO_ANSWER');
    let btn_yes = this.itemNameTraduction('MOBILE.ORDERS.YES_ANSWER');
    let content = this.itemNameTraduction('MOBILE.PAYMENTS.CONFIRM_TO_ADD_ACCOUNT') + ' ' + _pOrder.code + '?';

    let prompt = this._alertCtrl.create({
      message: content,
      buttons: [
      {
        text: btn_no,
        handler: data => {
        }
      },
      {
        text: btn_yes,
        handler: data => {
          this.closeWaimarkOrderToPay(_pOrder);
        }
      }
    ]
  });
  prompt.present();
}

  /**
   * Mark order to confirm if is accepted to translate payment
   * @param { any } _call 
   */
  closeWaimarkOrderToPay( _order : any ){
    let loading_msg = this.itemNameTraduction('MOBILE.WAITER_CALL.LOADING'); 
    
    let loading = this._loadingCtrl.create({
      content: loading_msg
    });
    loading.present();

    setTimeout(() => {
      let msg : string;
      if( _order.status === 'ORDER_STATUS.DELIVERED' ){
        let _lOrderTranslate = { firstOrderOwner: _order.creation_user, markedToTranslate: true, lastOrderOwner: Meteor.userId(), confirmedToTranslate: false };
        Orders.update({ _id: _order._id }, { $set: { status: 'ORDER_STATUS.PENDING_CONFIRM', modification_user: Meteor.userId(),
                                                      modification_date: new Date(), translateInfo: _lOrderTranslate } } );
        loading.dismiss();
        msg = this.itemNameTraduction('MOBILE.PAYMENTS.CONFIRM_OWNER_ORDER');
        this.presentToast(msg);
      } else {
        msg = this.itemNameTraduction('MOBILE.PAYMENTS.CONFIRM_ORDER_STATUS');
        this.presentToast(msg);
      }
    }, 1500);
  }

  /**
   * Function that allow show a toast confirmation
   */
  presentToast( _msg : string ) {
    let toast = this._toastCtrl.create({
      message: _msg,
      position: 'middle',
      showCloseButton: true,
      closeButtonText: 'Ok'
    });

    toast.onDidDismiss(() => {
    });

    toast.present();
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
   * ngOnDestroy implementation
   */
  ngOnDestroy(){
    this.removeSubscriptions();
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions():void{
    if( this._ordersSubscription ){ this._ordersSubscription.unsubscribe(); }
    if( this._itemsSubscription ){ this._itemsSubscription.unsubscribe(); }
  }
}