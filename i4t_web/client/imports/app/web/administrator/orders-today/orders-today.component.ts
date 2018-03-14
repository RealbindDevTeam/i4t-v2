import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription, Subject } from "rxjs";
import { Establishment } from '../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../both/collections/establishment/establishment.collection';
import { UserLanguageService } from '../../services/general/user-language.service';
//import { Order } from '../../../../../../both/models/establishment/order.model';
//import { Orders } from '../../../../../../both/collections/establishment/order.collection';
import { OrderHistory } from '../../../../../../both/models/establishment/order-history.model';
import { OrderHistories } from '../../../../../../both/collections/establishment/order-history.collection';
import { UserDetail, UserDetailImage } from '../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { Item } from '../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../both/collections/menu/item.collection';
import { Users } from 'both/collections/auth/user.collection';

@Component({
    selector: 'orders-today',
    templateUrl: './orders-today.component.html',
    styleUrls: ['./orders-today.component.scss']
})
export class OrdersTodayComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _establishmentsSubscription: Subscription;
    private _userSubscription: Subscription;
    private _userDetailSubscription: Subscription;
    private _usersSubscription: Subscription;
    private _orderHistorySubscription: Subscription;
    //private _orderSubscription: Subscription;
    //private _itemsSubscription: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishments: Observable<Establishment[]>;
    private _orderHistories: Observable<OrderHistory[]>;
    //private _orders: Observable<Order[]>;
    //private _items: Observable<Item[]>;
    private _userDetail: UserDetail;
    private _lEstablishmentsId: string[] = [];


    private _userFilter: string = "";
    private _establishmentFilter: string = "all";
    private _ordersCount: number = 0;
    private panelOpenState: boolean = false;
    private _loading: boolean = false;

    /**
     * OrdersTodayComponent constructor
     * @param _translate 
     * @param _userLanguageService 
     * @param _ngZone 
     */
    constructor(public _translate: TranslateService,
        private _userLanguageService: UserLanguageService,
        private _ngZone: NgZone) {
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._usersSubscription = MeteorObservable.subscribe('getUsers').takeUntil(this.ngUnsubscribe).subscribe();
        this._userDetailSubscription = MeteorObservable.subscribe('getUsersDetails').takeUntil(this.ngUnsubscribe).subscribe();

        this._establishmentsSubscription = MeteorObservable.subscribe('getActiveEstablishments', this._user).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                Establishments.collection.find({}).fetch().forEach((establishment: Establishment) => {
                    this._lEstablishmentsId.push(establishment._id);
                });
                this._establishments = Establishments.find({}).zone();
                this._orderHistorySubscription = MeteorObservable.subscribe('getOrderHistoryByEstablishmentIds', this._lEstablishmentsId).takeUntil(this.ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this.doFilter();
                        //this._orderHistories = OrderHistories.find({ customer_id: this._user, establishment_id: this._lEstablishmentsId }, { sort: { creation_date: -1 } }).zone();
                    });
                });

                /*
                this._orderSubscription = MeteorObservable.subscribe('getOrdersByEstablishmentIds', this._lEstablishmentsId, ['ORDER_STATUS.RECEIVED']).takeUntil(this.ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this.doFilter();
                    });
                });
                this._itemsSubscription = MeteorObservable.subscribe('getItemsByEstablishmentIds', this._lEstablishmentsId).takeUntil(this.ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this._items = Items.find({}).zone();
                    });
                });*/
            });
        });
    }

    /**
     * Do filter by username or email address
     */
    //doFilter(_pSearchValue: string, _pEstablishmentId: string) {
    doFilter() {
        let _lToday: Date = new Date();
        let _lUsersId: string[] = new Array();
        _lToday.setSeconds(0);
        _lToday.setMinutes(0);
        _lToday.setHours(0);

        this._loading = true;
        setTimeout(() => {

            if (this._userFilter) {
                let _lUserFilter = Users.collection.find({
                    $or: [
                        { "username": { $regex: this._userFilter }, 
                        { "emails.address": { $regex: this._userFilter } },
                        { "profile.name": { $regex: this._userFilter } }
                    ]
                });

                if (_lUserFilter.count() > 0) {
                    _lUserFilter.forEach(user => {
                        _lUsersId.push(user._id);
                    });
                }
            }

            this._lEstablishmentsId = new Array();
            if (this._establishmentFilter === 'all') {
                Establishments.collection.find({}).fetch().forEach((establishment: Establishment) => {
                    this._lEstablishmentsId.push(establishment._id);
                });
            } else {
                this._lEstablishmentsId.push(this._establishmentFilter);
            }

            if (this._userFilter) {
                this._orderHistories = OrderHistories.find({
                    establishment_id: { $in: this._lEstablishmentsId },
                    customer_id: { $in: _lUsersId },
                    creation_date: { $gt: _lToday }
                }).zone();
            } else {
                this._orderHistories = OrderHistories.find({
                    establishment_id: { $in: this._lEstablishmentsId },
                    creation_date: { $gt: _lToday }
                }).zone();
            }

            this._loading = false;
        }, 1000);
    }

    /**
     * Get user image
     * @param _pUserId 
     */
    getImgUser(_pUserId: UserDetail): string {
        let _lUser = Users.findOne({ _id: _pUserId });
        if (_lUser.services.facebook) {
            return "http://graph.facebook.com/" + _lUser.services.facebook.id + "/picture/?type=large";
        }
        let _lUserDetail = UserDetails.findOne({ user_id: _pUserId });
        if (_lUserDetail.image) {
            let _lUserDetailImage: UserDetailImage = _lUserDetail.image;
            if (_lUserDetailImage) {
                return _lUserDetailImage.url;
            }
        }
        return '/images/user_default_image.png';
    }

    /**
     * Get user name
     * @param _pUserId 
     */
    getUserName(_pUserId: UserDetail): string {
        let _lUser = Users.findOne({ _id: _pUserId });
        if (_lUser.username) {
            return _lUser.username
        }
        else if (_lUser.profile.name) {
            return _lUser.profile.name
        }
        return "";
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
    * Function to get item avalaibility 
    */
    /*getItemAvailability(itemId: string): boolean {
        let _itemEstablishment: Item = Items.collection.findOne({ _id: itemId }, { fields: { _id: 0, establishments: 1 } });
        let aux = _itemEstablishment.establishments.find(element => element.establishment_id === this._lEstablishmentsId);
        return aux.isAvailable;
    }*/

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        //if (this._userSubscription) { this._userSubscription.unsubscribe() };
        //if (this._orderSubscription) { this._orderSubscription.unsubscribe() };
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}