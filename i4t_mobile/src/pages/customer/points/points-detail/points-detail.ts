import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams, AlertController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription, Observable, Subject } from 'rxjs';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { OrderHistory } from 'i4t_web/both/models/establishment/order-history.model';
import { OrderHistories } from 'i4t_web/both/collections/establishment/order-history.collection';
import { Network } from '@ionic-native/network';

@Component({
    selector: 'points-detail',
    templateUrl: 'points-detail.html'
})
export class PointsDetailPage implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _orderHistorySub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _orderHistories: Observable<OrderHistory[]>;
    private _establishment_id: string;
    private _orderIndex: number = 0;

    private disconnectSubscription: Subscription;

    /**
     * PointsDetailPage constructor
     * @param {NavParams} _navParams 
     * @param {NavController} _navCtrl 
     * @param {TranslateService} _translate 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {NgZone} _ngZone
     */
    constructor(public _navParams: NavParams,
        public _navCtrl: NavController,
        public _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone, public _alertCtrl: AlertController,
        public _platform: Platform, private _network: Network) {
        this._establishment_id = this._navParams.get("_establishment_id");
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        if (this._establishment_id !== null && this._establishment_id !== undefined) {
            this._orderHistorySub = MeteorObservable.subscribe('getOrdersHistoryByUserId', this._user, this._establishment_id).takeUntil(this.ngUnsubscribe).subscribe(() => {
                this._ngZone.run(() => {
                    this._orderHistories = OrderHistories.find({ customer_id: this._user, establishment_id: this._establishment_id }, { sort: { creation_date: -1 } }).zone();
                });
            });
        }
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._orderHistorySub) { this._orderHistorySub.unsubscribe(); }
    }

    /**
     * Show order detail
     * @param {number} _index
     */
    showDetail(_index: number) {
        if (this._orderIndex === _index) {
            this._orderIndex = -1;
        } else {
            this._orderIndex = _index;
        }
    }

    /**
     * This function validates if string crop
     * @param { string } _pItemName 
     */
    itemNameCrop(_pItemName: string): string {
        if (_pItemName.length > 20 && _pItemName.indexOf(' ') <= 0) {
            return _pItemName.substring(1, 20) + '...';
        } else {
            return _pItemName;
        }
    }

    /**
     * Return order history redeemed points
     * @param {OrderHistory} _pOrderHistory 
     */
    getRedeemedPoints(_pOrderHistory: OrderHistory): number {
        let _lPoints: number = 0;
        _pOrderHistory.items.forEach((it) => {
            if (it.is_reward) {
                _lPoints += Number.parseInt(it.redeemed_points.toString());
            }
        });
        return _lPoints;
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

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
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

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
