import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { NavController, NavParams, AlertController, Platform } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable, Subject } from 'rxjs';
import { UserDetail } from 'i4t_web/both/models/auth/user-detail.model';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { WaiterCallPage } from '../waiter-call/waiter-call';
import { ChangeTablePage } from '../options/table-change/table-change';
import { EstablishmentExitPage } from './establishment-exit/establishment-exit';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { WaiterCallDetail } from 'i4t_web/both/models/establishment/waiter-call-detail.model';
import { WaiterCallDetails } from 'i4t_web/both/collections/establishment/waiter-call-detail.collection';
import { Network } from '@ionic-native/network';

@Component({
    selector: 'page-options',
    templateUrl: 'options.html'
})
export class OptionsPage implements OnInit, OnDestroy {

    private _userDetailSub: Subscription;
    private _waiterCallDetailSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _waiterCallsDetails: Observable<WaiterCallDetail[]>;
    private _userDetail: UserDetail;
    private _showWaiterAlert: boolean = false;

    private disconnectSubscription: Subscription;

    /**
     * OptionsPage constructor
     */
    constructor(public _navCtrl: NavController,
        public _navParams: NavParams,
        private _ngZone: NgZone,
        private _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        public alertCtrl: AlertController,
        public _platform: Platform,
        private _network: Network) {
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
        this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
            });
        });
        this._waiterCallDetailSub = MeteorObservable.subscribe('countWaiterCallDetailByUsrId', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._waiterCallsDetails = WaiterCallDetails.find({ user_id: Meteor.userId(), type: 'CALL_OF_CUSTOMER', establishment_id: this._userDetail.current_establishment, status: { $in: ["waiting", "completed"] } }).zone();
                this.countWaiterCalls();
                this._waiterCallsDetails.subscribe(() => { this.countWaiterCalls(); });
            });
        });
    }

    /**
   * Remove all subscriptions
   */
    removeSubscriptions() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**		
    * Count Waiter Calls		
    */
    countWaiterCalls(): void {
        let _lWaiterCalls: number = WaiterCallDetails.collection.find({ user_id: Meteor.userId(), type: 'CALL_OF_CUSTOMER', establishment_id: this._userDetail.current_establishment, status: { $in: ["waiting", "completed"] } }).count();
        _lWaiterCalls > 0 ? this._showWaiterAlert = true : this._showWaiterAlert = false;
    }

    /**
     * Go to waiter call page
     */
    goToWaiterCall() {
        this._navCtrl.push(WaiterCallPage);
    }

    /**
     * Go to change table page
     */
    goToChangeTable() {
        this._navCtrl.push(ChangeTablePage, { res_id: this._userDetail.current_establishment, table_id: this._userDetail.current_table });
    }

    /**
     * Go to establishment exit page
     */
    goToEstablishmentExit() {
        this._navCtrl.push(EstablishmentExitPage, { res_id: this._userDetail.current_establishment, table_id: this._userDetail.current_table });
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
        let alert = this.alertCtrl.create({
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
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}