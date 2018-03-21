import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingController, NavController, NavParams, AlertController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { WaiterCallDetails } from 'i4t_web/both/collections/establishment/waiter-call-detail.collection';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { Network } from '@ionic-native/network';

@Component({
  selector: 'page-waiter-call',
  templateUrl: 'waiter-call.html'
})
export class WaiterCallPage implements OnInit, OnDestroy {

  private _userDetailSubscription: Subscription;
  private _waiterCallDetailSubscription: Subscription;
  private _waitersSubscription: Subscription;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  private _userDetail: any;
  private _userDetails: any;
  private _waiters: any;

  private _countDetails: number;
  private _userLang: string;
  private _userEstablishment: boolean;
  private _validatedWaterCall: boolean;

  private disconnectSubscription: Subscription;

  /**
    * WaiterCallPage Constructor
    * @param { NavController } _navCtrl 
    * @param { NavParams } _navParams 
    * @param { TranslateService } _translate 
    */
  constructor(public _navCtrl: NavController,
    public _navParams: NavParams,
    public _translate: TranslateService,
    public _loadingCtrl: LoadingController,
    private _userLanguageService: UserLanguageServiceProvider,
    public _alertCtrl: AlertController,
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
      MeteorObservable.autorun().subscribe(() => {
        this._userDetails = UserDetails.find({ user_id: Meteor.userId() });
        this._userDetail = UserDetails.collection.find({ user_id: Meteor.userId() }).fetch()[0];
        if (this._userDetail) {
          if (this._userDetail.current_table == "" && this._userDetail.current_establishment == "") {
            this._userEstablishment = false;
          } else {
            this._userEstablishment = true;
          }
        }
      });
    });

    this._waitersSubscription = MeteorObservable.subscribe('getWaitersByCurrentEstablishment', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._waiters = UserDetails.find({ role_id: '200' });
    });

    this._waiterCallDetailSubscription = MeteorObservable.subscribe('countWaiterCallDetailByUsrId', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
      MeteorObservable.autorun().subscribe(() => {
        if (this._userEstablishment && this._userDetail) {
          this._countDetails = WaiterCallDetails.collection.find({ user_id: Meteor.userId(), type: 'CALL_OF_CUSTOMER', establishment_id: this._userDetail.current_establishment, status: { $in: ["waiting", "completed"] } }).count();
          if (this._countDetails > 0) {
            this._validatedWaterCall = true;
          } else {
            this._validatedWaterCall = false;
          }
        }
      });
    });
  }

  /**
   * ionViewWillEnter implementation
   */
  ionViewWillEnter() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    this.removeSubscriptions();
    this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).subscribe(() => {
      MeteorObservable.autorun().subscribe(() => {
        this._userDetails = UserDetails.find({ user_id: Meteor.userId() });
        this._userDetail = UserDetails.collection.find({ user_id: Meteor.userId() }).fetch()[0];
        if (this._userDetail && this._userDetail) {
          if (this._userDetail.current_table == "" && this._userDetail.current_establishment == "") {
            this._userEstablishment = false;
          } else {
            this._userEstablishment = true;
          }
        }
      });
    });

    this._waitersSubscription = MeteorObservable.subscribe('getWaitersByCurrentEstablishment', Meteor.userId()).subscribe(() => {
      this._waiters = UserDetails.find({ role_id: '200' });
    });

    this._waiterCallDetailSubscription = MeteorObservable.subscribe('countWaiterCallDetailByUsrId', Meteor.userId()).subscribe(() => {
      MeteorObservable.autorun().subscribe(() => {
        if (this._userEstablishment && this._userDetail) {
          this._countDetails = WaiterCallDetails.collection.find({ user_id: Meteor.userId(), type: 'CALL_OF_CUSTOMER', establishment_id: this._userDetail.current_establishment, status: { $in: ["waiting", "completed"] } }).count();
          if (this._countDetails > 0) {
            this._validatedWaterCall = true;
          } else {
            this._validatedWaterCall = false;
          }
        }
      });
    });
  }

  /**
   * Function that allows add calls to waiters enabled
   */
  addWaiterCall() {
    if (this._userDetail.current_table == "" && this._userDetail.current_establishment == "") {
      return;
    } else {
      var establishment_id = this._userDetail.current_establishment;
      var table_id = this._userDetail.current_table;
      var usrId = Meteor.userId();

      var data: any = {
        establishments: establishment_id,
        tables: table_id,
        user: usrId,
        waiter_id: "",
        status: "waiting",
        type: "CALL_OF_CUSTOMER",
      }

      let loading_msg = this.itemNameTraduction('MOBILE.WAITER_CALL.LOADING');

      let loading = this._loadingCtrl.create({
        content: loading_msg
      });
      loading.present();
      setTimeout(() => {
        MeteorObservable.call('findQueueByEstablishment', data).subscribe(() => {
          loading.dismiss();
        });
      }, 1500);
    }
  }

  /**
   * Function taht allow cancel calls to waiter
   */
  cancelWaiterCall() {
    let loading_msg = this.itemNameTraduction('MOBILE.WAITER_CALL.LOADING');

    let loading = this._loadingCtrl.create({
      content: loading_msg
    });
    loading.present();
    setTimeout(() => {
      let waiterCall = WaiterCallDetails.collection.find({ user_id: Meteor.userId(), type: 'CALL_OF_CUSTOMER', establishment_id: this._userDetail.current_establishment, status: { $in: ["waiting", "completed"] } }).fetch()[0];
      MeteorObservable.call('cancelCallClient', waiterCall, Meteor.userId()).subscribe(() => {
        loading.dismiss();
      });
    }, 1500);
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
    this.removeSubscriptions();
    this.disconnectSubscription.unsubscribe();
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
