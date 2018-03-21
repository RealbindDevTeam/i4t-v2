import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingController, NavController, NavParams, ToastController, AlertController, Platform } from 'ionic-angular';
import { MeteorObservable } from "meteor-rxjs";
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from "rxjs";
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { Table } from 'i4t_web/both/models/establishment/table.model';
import { Tables } from 'i4t_web/both/collections/establishment/table.collection';
import { WaiterCallDetail } from 'i4t_web/both/models/establishment/waiter-call-detail.model';
import { Users } from 'i4t_web/both/collections/auth/user.collection';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { Network } from '@ionic-native/network';

@Component({
    selector: 'send-order-detail-page',
    templateUrl: 'send-order-detail.html'
})
export class SendOrderDetailsPage implements OnInit, OnDestroy {

    private _orderSubscription: Subscription;
    private _usersSubscription: Subscription;
    private _tablesSubscription: Subscription;
    private _additionsSubscription: Subscription;
    private _call: WaiterCallDetail;

    private _tableNumber: string;
    private _tableQRCode: string;
    private _orders: any;

    private disconnectSubscription: Subscription;

    /**
     * SendOrderDetailsPage constructor
     * @param _params 
     */
    constructor(public _loadingCtrl: LoadingController,
        public _navCtrl: NavController,
        public _params: NavParams,
        public _translate: TranslateService,
        private _toastCtrl: ToastController,
        private _userLanguageService: UserLanguageServiceProvider,
        public _alertCtrl: AlertController,
        public _platform: Platform,
        private _network: Network) {
        _translate.setDefaultLang('en');
        this._call = this._params.get('call');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._orderSubscription = MeteorObservable.subscribe('getOrderById', this._call.order_id).subscribe(() => {
            this._orders = Orders.find({});
        });
        this._usersSubscription = MeteorObservable.subscribe('getUserByTableId', this._call.establishment_id, this._call.table_id).subscribe();
        this._tablesSubscription = MeteorObservable.subscribe('getTablesByEstablishment', this._call.establishment_id).subscribe(() => {
            let _lTable: Table = Tables.collection.find({ _id: this._call.table_id }).fetch()[0];
            this._tableNumber = _lTable._number + '';
            this._tableQRCode = _lTable.QR_code;
        });
        this._additionsSubscription = MeteorObservable.subscribe('additionsByEstablishment', this._call.establishment_id).subscribe();
    }

    /**
     * Return User Name
     * @param {string} _pUserId 
     */
    getUserName(_pUserId: string): string {
        let _user = Users.collection.find({}).fetch().filter(u => u._id === _pUserId)[0];
        if (_user) {
            if (_user.username) {
                return _user.username;
            }
            else if (_user.profile.name) {
                return _user.profile.name;
            }
        }
    }

    /**
     * Get Addition name
     * @param _pAdditionId 
     */
    getNameAddition(_pAdditionId: string): string {
        let _lAddition = Additions.collection.findOne({ _id: _pAdditionId });
        if (_lAddition) {
            return _lAddition.name;
        } else {
            return;
        }
    }

    /**
    * Function that allows remove a job of the Waiter Calls queue
    */
    closeWaiterCall() {
        let loading_msg = this.itemNameTraduction('MOBILE.WAITER_CALL.LOADING');

        let loading = this._loadingCtrl.create({
            content: loading_msg
        });
        loading.present();
        setTimeout(() => {
            MeteorObservable.call('closeCall', this._call, Meteor.userId()).subscribe(() => {
                loading.dismiss();
                this.presentToast();
                this._navCtrl.pop();
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
        if (this._orderSubscription) { this._orderSubscription.unsubscribe(); }
        if (this._usersSubscription) { this._usersSubscription.unsubscribe(); }
        if (this._tablesSubscription) { this._tablesSubscription.unsubscribe(); }
        if (this._additionsSubscription) { this._additionsSubscription.unsubscribe(); }
    }
}