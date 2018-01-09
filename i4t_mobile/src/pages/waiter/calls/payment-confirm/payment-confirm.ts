import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, LoadingController, NavParams, NavController, ToastController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from "meteor-rxjs";
import { Subscription } from "rxjs";
//import { Payment } from 'i4t_web/both/models/establishment/payment.model';
//import { Payments } from 'i4t_web/both/collections/establishment/payment.collection';
import { Currencies } from 'i4t_web/both/collections/general/currency.collection';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { Tables } from 'i4t_web/both/collections/establishment/table.collection';
import { Users } from 'i4t_web/both/collections/auth/user.collection';
import { WaiterCallDetail } from 'i4t_web/both/models/establishment/waiter-call-detail.model';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';

@Component({
  selector: 'payment-confirm-page',
  templateUrl: 'payment-confirm.html'
})
export class PaymentConfirmPage implements OnInit, OnDestroy {

  private _usersDetailSubscription: Subscription;
  private _paymentsSubscription: Subscription;
  private _ordersSubscription: Subscription;
  private _tablesSubscription: Subscription;
  private _currencySubscription: Subscription;
  private _call: WaiterCallDetail;
  private _payments: any;
  private _orders: any;
  private _paymentsToPay: any;
  private _table: any;
  private _establishmentId: string;
  private _tableId: string;
  private _currencyCode: string = '';
  private _totalPayment: number = 0;
  private _ordersTotalPay: number = 0;

  /**
   * PaymentConfirmPage constructor
   * @param _translate 
   * @param _params 
   * @param _alertCtrl 
   * @param _loadingCtrl 
   * @param _navCtrl 
   * @param _toastCtrl 
   * @param _userLanguageService 
   */
  constructor(public _translate: TranslateService,
    public _params: NavParams,
    public _alertCtrl: AlertController,
    public _loadingCtrl: LoadingController,
    public _navCtrl: NavController,
    private _toastCtrl: ToastController,
    private _userLanguageService: UserLanguageServiceProvider) {
    _translate.setDefaultLang('en');
    this._call = this._params.get('call');
    this._establishmentId = this._call.establishment_id;
    this._tableId = this._call.table_id;
  }

  /**
   * ngOnInti Implementation
   */
  ngOnInit() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    this.removeSubscriptions();
    this._usersDetailSubscription = MeteorObservable.subscribe('getUsers').subscribe();
    this._tablesSubscription = MeteorObservable.subscribe('getTablesByEstablishment', this._establishmentId).subscribe();
    this._currencySubscription = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', [this._establishmentId]).subscribe();

    this._ordersSubscription = MeteorObservable.subscribe('getOrdersByTableId', this._establishmentId, this._tableId, ['ORDER_STATUS.DELIVERED']).subscribe(() => {
      this._orders = Orders.find({});
      this._orders.subscribe(() => {
        this.totalOrders();
      });
    });

    this._paymentsSubscription = MeteorObservable.subscribe('getPaymentsToWaiter', this._establishmentId, this._tableId).subscribe(() => {
      //this._payments = Payments.find({ establishment_id: this._establishmentId, tableId: this._tableId });
      /*this._paymentsToPay = Payments.collection.find({
        establishment_id: this._establishmentId,
        tableId: this._tableId,
        status: 'PAYMENT.NO_PAID',
        received: true
      });*/

      this._payments.subscribe(() => {
        this.totalPayment();
      });
    });

    this._table = Tables.collection.find({ _id: this._tableId }).fetch()[0];
  }

  /**
   * Calculate the Orders total correspondly to table
   */
  totalOrders() {
    this._ordersTotalPay = 0;
    Orders.collection.find({}).fetch().forEach((order) => {
      this._ordersTotalPay += order.totalPayment;
    });
  }

  /**
   * This function allow get currency code
   * @param { string } _currencyId 
   */
  getCurrency(_currencyId: string): string {
    if (_currencyId) {
      let _currency = Currencies.findOne({ _id: _currencyId });
      return _currency.code;
    } else {
      return "Hola";
    }
  }

  /**
   * Calculate the payment total
   */
  totalPayment() {
    this._totalPayment = 0;
    /*Payments.find({ establishment_id: this._establishmentId, tableId: this._tableId }).fetch().forEach((pay) => {
      this._totalPayment += pay.totalToPayment;
    });*/
  }

  /**
   * This function allow get user name
   * @param _id 
   */
  getUserDetail(_id: string) {
    let user = Users.collection.find({ _id: _id }).fetch()[0];
    if (user.username) {
      return user.username;
    } else if (user.services.facebook) {
      return user.services.facebook.name;
    }
  }

  /**
   * Validate payments received
   */
  validatePaymentsReceived() {
    if (this._paymentsToPay.count() > 0) {
      this.showComfirmPay();
    } else {
      let msg = this.itemNameTraduction('MOBILE.PAYMENTS.PAY_CONFIRM_MODAL');
      let alert = this._alertCtrl.create({
        subTitle: msg,
        buttons: ['OK']
      });
      alert.present();
    }
  }

  /**
   * Function that allows show comfirm dialog
   */
  showComfirmPay() {
    let btn_no = this.itemNameTraduction('MOBILE.ORDERS.NO_ANSWER');
    let btn_yes = this.itemNameTraduction('MOBILE.ORDERS.YES_ANSWER');
    let title = this.itemNameTraduction('MOBILE.SYSTEM_MSG');
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
            this.closePayment();
          }
        }
      ]
    });
    prompt.present();
  }

  /**
   * Payments and Waiter call detail close
   */
  closePayment() {
    let loading_msg = this.itemNameTraduction('MOBILE.WAITER_CALL.LOADING');

    let loading = this._loadingCtrl.create({
      content: loading_msg
    });
    loading.present();

    setTimeout(() => {
      this.closePay().then((result) => {
        if (result) {
          loading.dismiss();
          this.presentToast();
        } else {
          loading.dismiss();
        }
      }).catch((err) => {
        loading.dismiss();
      });
    }, 1500);
    this._navCtrl.pop();
  }

  /**
    * Promise to close pay
    */
  closePay(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        MeteorObservable.call('closePay', this._establishmentId, this._tableId, this._call).subscribe(() => {
          resolve(true);
        }, (error) => {
          resolve(false);
        });
      } catch (e) {
        reject(e);
      }
    });
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
   * 
   */
  receivedAllPayments(event: any) {
    /*Payments.find({ establishment_id: this._establishmentId, tableId: this._tableId }).fetch().forEach((pay) => {
      Payments.update({ _id: pay._id }, { $set: { received: event.checked } });
    });*/
  }

  /**
   * Set to Payment received value
   * @param _pay 
   */
  /*received(_pay: Payment) {
    Payments.update({ _id: _pay._id }, { $set: { received: !_pay.received } });
  }*/


  /**
   * ngOnDestroy Implementation
   */
  ngOnDestroy() {
    this.removeSubscriptions();
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions(): void {
    if (this._usersDetailSubscription) { this._usersDetailSubscription.unsubscribe(); }
    if (this._paymentsSubscription) { this._paymentsSubscription.unsubscribe(); }
    if (this._ordersSubscription) { this._ordersSubscription.unsubscribe(); }
    if (this._tablesSubscription) { this._tablesSubscription.unsubscribe(); }
    if (this._currencySubscription) { this._currencySubscription.unsubscribe(); }
  }

}