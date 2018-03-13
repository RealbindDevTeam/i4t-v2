import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription, Subject } from "rxjs";
import { UserLanguageService } from '../../services/general/user-language.service';
import { Order } from '../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../both/collections/establishment/order.collection';
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
    private _userSubscription: Subscription;
    private _userDetailSubscription: Subscription;
    private _usersSubscription: Subscription;
    private _orderSubscription: Subscription;
    private _itemsSubscription: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _ordersCount: number = 0;
    private _orders: Observable<Order[]>;
    private _items: Observable<Item[]>;
    private _userDetail: UserDetail;

    private _userFilter: string = "";
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
        this._orderSubscription = MeteorObservable.subscribe('getOrdersByEstablishmentIds', ['D2aqghNQrxAuk9Pbi'], ['ORDER_STATUS.RECEIVED']).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this.doFilter(null);
            });
        });
        this._itemsSubscription = MeteorObservable.subscribe('itemsByEstablishment', 'D2aqghNQrxAuk9Pbi').takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
            });
        });
    }

    /**
     * Do filter by username or email address
     */
    doFilter(_pSearchValue: string) {
        let _lToday: Date = new Date();
        _lToday.setSeconds(0);
        _lToday.setMinutes(0);
        _lToday.setHours(0);

        this._loading = true;
        setTimeout(() => {
            if (_pSearchValue) {
                let _lUserFilter = Users.collection.find({ $or: [{ "username": { $regex: _pSearchValue }, { "emails.address": { $regex: _pSearchValue } }] });
                if (_lUserFilter.count() > 0) {
                    let _lUsersId: string[] = new Array();
                    _lUserFilter.forEach(user => {
                        _lUsersId.push(user._id);
                    });
                    this._orders = Orders.find({ creation_user: { $in: _lUsersId }, creation_date: { $gt: _lToday } }).zone();
                    let _orders = Orders.collection.find({ creation_user: { $in: _lUsersId }, creation_date: { $gt: _lToday } }).count();
                } else {
                    this._orders = null;
                }
            } else {
                this._orders = Orders.find({}).zone();
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
    * Function to get item avalaibility 
    */
    getItemAvailability(itemId: string): boolean {
        let _itemEstablishment: Item = Items.collection.findOne({ _id: itemId }, { fields: { _id: 0, establishments: 1 } });
        let aux = _itemEstablishment.establishments.find(element => element.establishment_id === 'D2aqghNQrxAuk9Pbi');
        return aux.isAvailable;
    }

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