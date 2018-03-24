import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AlertController, LoadingController, NavController, ToastController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from "meteor-rxjs";
import { Subscription, Subject } from "rxjs";
import { Establishments } from 'i4t_web/both/collections/establishment/establishment.collection';
import { Tables } from 'i4t_web/both/collections/establishment/table.collection';
import { WaiterCallDetail } from 'i4t_web/both/models/establishment/waiter-call-detail.model';
import { WaiterCallDetails } from 'i4t_web/both/collections/establishment/waiter-call-detail.collection';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { SendOrderDetailsPage } from './send-order-detail/send-order-detail';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { CustomerOrderConfirm } from "./customer-order-confirm/customer-order-confirm";
import { Network } from '@ionic-native/network';

@Component({
  selector: 'calls-page',
  templateUrl: 'calls.html'
})
export class CallsPage implements OnInit, OnDestroy {

  private _userEstablishmentSubscription: Subscription;
  private _userDetailSubscription: Subscription;
  private _callsDetailsSubscription: Subscription;
  private _tableSubscription: Subscription;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  private _userDetail: any;
  private _establishments: any;
  private _waiterCallDetail: any;
  private _tables: any;
  private _waiterCallDetailCollection: any;
  private _imgEstablishment: any;
  private _thereAreCalls: boolean = true;

  private _userLang: string;
  private disconnectSubscription: Subscription;

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
    private _userLanguageService: UserLanguageServiceProvider,
    private _ngZone: NgZone,
    public _platform: Platform,
    private _network: Network) {
    _translate.setDefaultLang('en');
  }

  /**
   * ngOnInit Implementation
   */
  ngOnInit() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    this.removeSubscriptions();
    this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
        if (this._userDetail) {
          this._userEstablishmentSubscription = MeteorObservable.subscribe('getEstablishmentById', this._userDetail.establishment_work).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
              this._establishments = Establishments.find({ _id: this._userDetail.establishment_work });
            });
          });
          this._tableSubscription = MeteorObservable.subscribe('getTablesByEstablishmentWork', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
              this._tables = Tables.find({ establishment_id: this._userDetail.establishment_work, is_active: true });
            });
          });
        }
      });
    });

    this._callsDetailsSubscription = MeteorObservable.subscribe('waiterCallDetailByWaiterId', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        this._waiterCallDetail = WaiterCallDetails.find({ waiter_id: Meteor.userId(), status: "completed" }).zone();
        this._waiterCallDetailCollection = WaiterCallDetails.collection.find({}).fetch()[0];
        this.countCalls();
        this._waiterCallDetail.subscribe(() => { this.countCalls(); });
      });
    });
  }

  /**
     * Count calls
     */
  countCalls(): void {
    let _lCalls: number = WaiterCallDetails.collection.find({}).count();
    _lCalls > 0 ? this._thereAreCalls = true : this._thereAreCalls = false;
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
   * Go to view Order detail send
   * @param _call 
   */
  goToViewOrderDetailSend(_call: WaiterCallDetail) {
    this._navCtrl.push(SendOrderDetailsPage, { call: _call });
  }

  /**
   * Go to order call
   */
  goToOrderCall(_call: WaiterCallDetail) {
    this._navCtrl.push(CustomerOrderConfirm, { call: _call });
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
   * NgOnDestroy Implementation
   */
  ngOnDestroy() {
    this.removeSubscriptions();
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}