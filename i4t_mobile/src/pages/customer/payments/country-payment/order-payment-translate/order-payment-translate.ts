import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, LoadingController, NavController, NavParams, ToastController } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs'
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Orders } from 'i4t_web/both/collections/restaurant/order.collection';
import { AddOrderPaymentPage } from "./add-order-payment/add-order-payment";
import { UserLanguageServiceProvider } from '../../../../../providers/user-language-service/user-language-service';
import { OrderTranslateInfo } from 'i4t_web/both/models/restaurant/order.model';

/*
  Generated class for the Order-Payment-Translate page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'order-payment-translate-page',
  templateUrl: 'order-payment-translate.html'
})

export class OrderPaymentTranslatePage implements OnInit, OnDestroy {
    
  private _ordersSubscription : Subscription;

  private _ordersToConfirm               : any;
  private _ordersWithPendingConfirmation : any;
  private _restaurantId    : string;
  private _tableId         : string;
  private _currency        : string;
  private _currentUserId   : string;
  private _orderIndex      : number = -1;

  /**
   * OrderPaymentTranslatePage constructor
    * @param _navParams 
    * @param _navCtrl 
    * @param _userLanguageService 
    * @param _translate 
    */
  constructor(private _userLanguageService: UserLanguageServiceProvider,
              private _toastCtrl  : ToastController,
              public _navParams: NavParams, 
              public _alertCtrl   : AlertController,
              public _loadingCtrl : LoadingController,
              public _navCtrl: NavController,
              public _translate: TranslateService){
    _translate.setDefaultLang('en');
    this._restaurantId = this._navParams.get("restaurant");
    this._tableId      = this._navParams.get("table");
    this._currency     = this._navParams.get("currency");
    this._currentUserId = Meteor.userId();
  }

  /**
   * ngOnInit implementation
   */
  ngOnInit(){
    this._translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
    this.removeSubscriptions();
    this._ordersSubscription = MeteorObservable.subscribe( 'getOrdersWithConfirmationPending', this._restaurantId, this._tableId ).subscribe( () => {
      this._ordersToConfirm = Orders.find( { status: 'ORDER_STATUS.PENDING_CONFIRM', 
                                            'translateInfo.firstOrderOwner': Meteor.userId(), 
                                            'translateInfo.lastOrderOwner': { $not: '' } } ).zone();
      this._ordersWithPendingConfirmation = Orders.find( { status: 'ORDER_STATUS.PENDING_CONFIRM', 
                                                           'translateInfo.lastOrderOwner': Meteor.userId() } ).zone();
    });
  }

  /**
     * ionViewWillEnter implementation
     */
    ionViewWillEnter() {
      this._translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
      this.removeSubscriptions();
      this._ordersSubscription = MeteorObservable.subscribe( 'getOrdersWithConfirmationPending', this._restaurantId, this._tableId ).subscribe( () => {
          this._ordersToConfirm = Orders.find( { status: 'ORDER_STATUS.PENDING_CONFIRM', 
                                                  'translateInfo.firstOrderOwner': Meteor.userId(), 
                                                  'translateInfo.lastOrderOwner': { $not: '' } } ).zone();
          this._ordersWithPendingConfirmation = Orders.find( { status: 'ORDER_STATUS.PENDING_CONFIRM', 
                                                                'translateInfo.lastOrderOwner': Meteor.userId() } ).zone();
      });
    }

  /**
   * Show modal confirm
   * @param _pOrder 
   */
  showConfirm( _pOrder: any ):void{
    let btn_no  = this.itemNameTraduction('MOBILE.ORDERS.NO_ANSWER');
    let btn_yes = this.itemNameTraduction('MOBILE.ORDERS.YES_ANSWER');
    let content = this.itemNameTraduction('MOBILE.PAYMENTS.CONFIRM_PAY_OTHER_USER') + ' ' + _pOrder.code + '?';
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
          this.confirmOrderToPay(_pOrder);
        }
      }
      ]
    });
    prompt.present();
  }
    
  /**
   * Function to confirm order pay translate
   * @param {Order} _pOrder 
   */
  confirmOrderToPay( _pOrder : any ):void {
    let loading_msg = this.itemNameTraduction('MOBILE.WAITER_CALL.LOADING'); 
    let loading = this._loadingCtrl.create({
      content: loading_msg
    });
    loading.present();
    
    setTimeout(() => {
      let msg : string;
      let _lUser = _pOrder.translateInfo.lastOrderOwner;
      Orders.update({ _id: _pOrder._id }, { $set: { creation_user: _lUser, modification_user: Meteor.userId(), modification_date: new Date(), 
                                                    'translateInfo.confirmedToTranslate': true, status: 'ORDER_STATUS.DELIVERED' }});
      loading.dismiss();
        msg = this.itemNameTraduction('MOBILE.PAYMENTS.SUCCESSFUL_PAY_OTHER_USER');
        this.presentToast(msg);
      }, 1500);
    }

  /**
   * Show modal cancel confirm
   * @param _pOrder 
   */
  showCancelConfirm( _pOrder: any ):void{
    let btn_no  = this.itemNameTraduction('MOBILE.ORDERS.NO_ANSWER');
    let btn_yes = this.itemNameTraduction('MOBILE.ORDERS.YES_ANSWER');
    let content = this.itemNameTraduction('MOBILE.PAYMENTS.CANCEL_PAY_OTHER_USER') + ' ' + _pOrder.code + '?';
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
          this.cancelOrderToPay(_pOrder);
        }
      }
      ]
    });
    prompt.present();
  }

  /**
   * Function to cancel order pay translate
   * @param _pOrder 
   */
  cancelOrderToPay( _pOrder : any ):void {
    let loading_msg = this.itemNameTraduction('MOBILE.WAITER_CALL.LOADING'); 
    let loading = this._loadingCtrl.create({
      content: loading_msg
    });
    loading.present();
      
    setTimeout(() => {
      let msg : string;
      let _lUser = _pOrder.translateInfo.lastOrderOwner;
        
      let _lOrderTranslate : OrderTranslateInfo = { firstOrderOwner: _pOrder.translateInfo.firstOrderOwner, markedToTranslate: false, lastOrderOwner: '', confirmedToTranslate: false };
      Orders.update( { _id: _pOrder._id }, { $set: { modification_user: Meteor.userId(), modification_date: new Date(), 
                                                      translateInfo: _lOrderTranslate, status: 'ORDER_STATUS.DELIVERED' }});
      loading.dismiss();
        msg = this.itemNameTraduction('MOBILE.PAYMENTS.CANCELED_PAY_OTHER_USER');
        this.presentToast(msg);
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
     * Go to add orders
     */
    goToAddOrders(){
      this._navCtrl.push(AddOrderPaymentPage, { restaurant : this._restaurantId, table : this._tableId, currency : this._currency });
    }

    showDetail(i) {
      if (this._orderIndex == i) {
          this._orderIndex = -1;
      } else {
          this._orderIndex = i;
      }
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
    }
}