import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable, Subject } from 'rxjs';
import { ViewController, NavParams, ToastController, LoadingController, NavController, AlertController, Platform } from 'ionic-angular';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { MeteorObservable } from 'meteor-rxjs';
import { Reward } from 'i4t_web/both/models/establishment/reward.model';
import { Rewards } from 'i4t_web/both/collections/establishment/reward.collection';
import { Item, ItemImage } from 'i4t_web/both/models/menu/item.model';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { UserDetail } from 'i4t_web/both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../i4t_web/both/collections/auth/user-detail.collection';
import { Order, OrderItem } from 'i4t_web/both/models/establishment/order.model';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { Network } from '@ionic-native/network';

@Component({
    templateUrl: 'reward-list.html',
    selector: 'reward-list'
})

export class RewardListComponent {

    private _user = Meteor.userId();
    private _itemsSub: Subscription;
    private _rewardsSub: Subscription;
    private _userDetailSub: Subscription;
    private _ordersSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _items: Observable<Item[]>;
    private _rewards: Observable<Reward[]>;
    private _establishmentId: string;
    private _userDetail: UserDetail;
    private _allowAddRewardsToOrder: boolean = true;
    private _statusArray: string[] = ['ORDER_STATUS.SELECTING', 'ORDER_STATUS.CONFIRMED'];
    private _thereRewards: boolean = true;

    private disconnectSubscription: Subscription;

    constructor(public viewCtrl: ViewController,
        public _translate: TranslateService,
        public _navParams: NavParams,
        private toastCtrl: ToastController,
        public _loadingCtrl: LoadingController,
        public _navCtrl: NavController,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone,
        public alertCtrl: AlertController,
        public _platform: Platform,
        private _network: Network) {
        _translate.setDefaultLang('en');
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));

        this._establishmentId = this._navParams.get("establishment");
    }

    ngOnInit() {
        this.removeSubscriptions();

        this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', this._user).takeUntil(this.ngUnsubscribe).subscribe();
        this._itemsSub = MeteorObservable.subscribe('itemsByEstablishment', this._establishmentId).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
            });
        });

        this._rewardsSub = MeteorObservable.subscribe('getEstablishmentRewards', this._establishmentId).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._rewards = Rewards.find({ establishments: { $in: [this._establishmentId] } }, { sort: { points: 1 } }).zone();
                this._rewards.subscribe(()=>{
                    let count = Rewards.collection.find({ establishments: { $in: [this._establishmentId] } }, { sort: { points: 1 } }).count();
                    if(count > 0){
                        this._thereRewards = false;
                    } else {
                        this._thereRewards = true;
                    }
                });
            });
        });

        this._ordersSub = MeteorObservable.subscribe('getOrdersByUserId', this._user, this._statusArray).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                Orders.collection.find({ creation_user: this._user }).fetch().forEach((order) => {
                    if (order.status === 'ORDER_STATUS.SELECTING') {
                        order.items.forEach((it) => {
                            if (it.is_reward) {
                                this._allowAddRewardsToOrder = false;
                            }
                        });
                    }
                });
            });
        });
    }

    /**This function gets the item image or default
     * @param {string} _itemId
     * @return {string}
     */
    getItemThumb(_itemId: string): string {

        let item: Item;
        //let itemImage: ItemImage;

        item = Items.findOne({ _id: _itemId });
        if (item) {
            if (item.image) {
                return item.image.url;
            } else {
                return 'assets/img/default-plate.png';
            }
        }
    }

    /**
     * this function gets the item name
     * @param {string} _itemId
     * @return {string}
     */
    getItemName(_itemId: string): string {
        let item: Item;
        item = Items.findOne({ _id: _itemId });
        if (item) {
            return item.name;
        }
    }

    /**
     * This function gets if item is avalaible
     * @param {string} _itemId
     * @return {boolean}
     */
    getItemAvailability(_itemId: string) {
        let item: Item = Items.findOne({ _id: _itemId });
        if (item) {
            let aux = item.establishments.find(element => element.establishment_id === this._establishmentId);
            return aux.isAvailable;
        }
    }

    /**
     * This function gets user establishment points
     * @return {number} 
     */
    getUserPoints(): number {
        this._userDetail = UserDetails.findOne({ user_id: this._user });
        if (this._userDetail) {
            if (this._userDetail.reward_points) {
                let aux = this._userDetail.reward_points.find(element => element.establishment_id === this._establishmentId);
                return aux.points;
            }
        }
    }

    /**
     * This function verify if user can redeem the reward
     */
    isValidRewardPoints(_rewardPts: string): boolean {
        this._userDetail = UserDetails.findOne({ user_id: this._user });
        if (this._userDetail.reward_points) {
            let userPoints = this._userDetail.reward_points.find(element => element.establishment_id === this._establishmentId).points;
            if (userPoints >= Number.parseInt(_rewardPts.toString())) {
                return true;
            } else {
                return false;
            }
        }
    }

    showReward(_itemId: string) {
        let item: Item = Items.findOne({ _id: _itemId });
        if (item) {
            return true;
        } else {
            return false;
        }
    }

    /**
  * Add reward in order with SELECTING state
  * @param {string} _pItemToInsert
  * @param {number} _pItemQuantiy
  * @param {number} _pRewardPoints
  */
    addRewardToOrder(_pItemToInsert: string, _pItemQuantiy: number, _pRewardPoints: number): void {
        let _lOrderItemIndex: number = 0;
        let _lOrder: Order = Orders.collection.find({ creation_user: this._user, establishment_id: this._establishmentId }).fetch()[0];

        if (_lOrder) {
            _lOrderItemIndex = _lOrder.orderItemCount + 1;
        } else {
            _lOrderItemIndex = 1;
        }

        let _lOrderItem: OrderItem = {
            index: _lOrderItemIndex,
            itemId: _pItemToInsert,
            quantity: _pItemQuantiy,
            observations: '',
            //garnishFood: [],
            options: [],
            additions: [],
            paymentItem: 0,
            reward_points: 0,
            is_reward: true,
            redeemed_points: _pRewardPoints
        };

        let _loadingMsg = this.itemNameTraduction('MOBILE.REWARD_LIST.LOADING_MSG');
        let loading = this._loadingCtrl.create({
            content: _loadingMsg
        });
        loading.present();

        if (this._userDetail) {
            let tableId = this._userDetail.current_table;
            setTimeout(() => {
                MeteorObservable.call('AddItemToOrder2', _lOrderItem, this._establishmentId, tableId, 0, 0).subscribe(() => {
                    loading.dismiss();
                    this._navCtrl.pop();
                    this.presentToast();
                }, (error) => {
                    alert(`Error: ${error}`);
                });
            }, 1500);
        }
    }

    /**
  * This function present the toast to add the reward to de order
  */
    presentToast() {
        let _lMessage: string = this.itemNameTraduction('MOBILE.REWARD_LIST.REWARD_AGGREGATED');
        let toast = this.toastCtrl.create({
            message: _lMessage,
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
        this.disconnectSubscription.unsubscribe();
    }

    /**
  * This function lets to tranla
  * @param itemName 
  */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }


    removeSubscriptions() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}