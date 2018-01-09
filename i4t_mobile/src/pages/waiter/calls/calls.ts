import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, LoadingController, NavController, ToastController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from "meteor-rxjs";
import { Subscription } from "rxjs";
import { Establishments } from 'i4t_web/both/collections/establishment/establishment.collection';
import { Tables } from 'i4t_web/both/collections/establishment/table.collection';
import { WaiterCallDetail } from 'i4t_web/both/models/establishment/waiter-call-detail.model';
import { WaiterCallDetails } from 'i4t_web/both/collections/establishment/waiter-call-detail.collection';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { PaymentConfirmPage } from "./payment-confirm/payment-confirm";
import { SendOrderDetailsPage } from './send-order-detail/send-order-detail';
import { EstablishmentExitConfirmPage } from './establishment-exit-confirm/establishment-exit-confirm';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';

@Component({
  selector: 'calls-page',
  templateUrl: 'calls.html'
})
export class CallsPage implements OnInit, OnDestroy {

  private _userEstablishmentSubscription: Subscription;
  private _userDetailSubscription: Subscription;
  private _callsDetailsSubscription: Subscription;
  private _tableSubscription: Subscription;

  private _userDetail: any;
  private _establishments: any;
  private _waiterCallDetail: any;
  private _tables: any;
  private _waiterCallDetailCollection: any;
  private _imgEstablishment: any;

  private _userLang: string;

  /**
    * CallsPage Constructor
    * @param { TranslateService } _translate 
    * @param { AlertController } _alertCtrl 
    * @param { LoadingController } _loadingCtrl 
    * @param { ToastController } _toastCtrl 
    */
  constructor(public _translate: TranslateService,
    public _alertCtrl: AlertController,
    public _loadingCtrl: LoadingController,
    private _toastCtrl: ToastController,
    public _navCtrl: NavController,
    private _userLanguageService: UserLanguageServiceProvider) {
    _translate.setDefaultLang('en');
  }

  /**
   * ngOnInit Implementation
   */
  ngOnInit() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    this.removeSubscriptions();
    this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).subscribe(() => {
      this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
      if (this._userDetail) {
        this._userEstablishmentSubscription = MeteorObservable.subscribe('getEstablishmentById', this._userDetail.establishment_work).subscribe(() => {
          this._establishments = Establishments.find({ _id: this._userDetail.establishment_work });
        });
      }
    });

    this._callsDetailsSubscription = MeteorObservable.subscribe('waiterCallDetailByWaiterId', Meteor.userId()).subscribe(() => {
      this._waiterCallDetail = WaiterCallDetails.find({});
      this._waiterCallDetailCollection = WaiterCallDetails.collection.find({}).fetch()[0];
    });

    this._tableSubscription = MeteorObservable.subscribe('getTablesByEstablishmentWork', Meteor.userId()).subscribe(() => {
      this._tables = Tables.find({});
    });

  }

  /**
   * Function that allows show comfirm dialog
   * @param { any } _call 
   */
  showComfirmClose(_call: any) {
    let btn_no = this.itemNameTraduction('MOBILE.ORDERS.NO_ANSWER');
    let btn_yes = this.itemNameTraduction('MOBILE.ORDERS.YES_ANSWER');
    let title = this.itemNameTraduction('MOBILE.WAITER_CALL.TITLE_PROMPT');
    let content = this.itemNameTraduction('MOBILE.WAITER_CALL.CONTENT_PROMPT');

    let prompt = this._alertCtrl.create({
      title: title,
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
            this.closeWaiterCall(_call);
          }
        }
      ]
    });
    prompt.present();
  }

  /**
   * Function that allows remove a job of the Waiter Calls queue
   * @param { any } _call 
   */
  closeWaiterCall(_call: WaiterCallDetail) {
    let loading_msg = this.itemNameTraduction('MOBILE.WAITER_CALL.LOADING');

    let loading = this._loadingCtrl.create({
      content: loading_msg
    });
    loading.present();
    setTimeout(() => {
      MeteorObservable.call('closeCall', _call, Meteor.userId()).subscribe(() => {
        loading.dismiss();
        this.presentToast();
      });
    }, 1500);
  }

  /**
   * Function that allow show a toast confirmation
   */
  presentToast() {
    let msg = this.itemNameTraduction('MOBILE.WAITER_CALL.MSG_COMFIRM');
    let toast = this._toastCtrl.create({
      message: msg,
      duration: 1500,
      position: 'middle'
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
  * This function allow navegate to PaymentConfirmPage
  * @param {WaiterCallDetail} _call
  */
  goToPaymentConfirm(_call: WaiterCallDetail) {
    this._navCtrl.push(PaymentConfirmPage, { call: _call });
  }

  /**
   * Go to view Order detail send
   * @param _call 
   */
  goToViewOrderDetailSend(_call: WaiterCallDetail) {
    this._navCtrl.push(SendOrderDetailsPage, { call: _call });
  }


  /**
   * Go to cancel order
   */
  goToCancelOrder(_call: WaiterCallDetail) {
    this._navCtrl.push(EstablishmentExitConfirmPage, { call: _call });
  }

  /**
   * NgOnDestroy Implementation
   */
  ngOnDestroy() {
    this.removeSubscriptions();
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions(): void {
    if (this._userDetailSubscription) { this._userDetailSubscription.unsubscribe(); }
    if (this._userEstablishmentSubscription) { this._userEstablishmentSubscription.unsubscribe(); }
    if (this._callsDetailsSubscription) { this._callsDetailsSubscription.unsubscribe(); }
    if (this._tableSubscription) { this._tableSubscription.unsubscribe(); }
  }

}