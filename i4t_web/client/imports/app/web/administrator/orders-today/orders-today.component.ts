import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription, Subject } from "rxjs";
import { UserLanguageService } from '../../services/general/user-language.service';
import { Order } from '../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../both/collections/establishment/order.collection';
import { UserDetail } from '../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { Users } from 'both/collections/auth/user.collection';

@Component({
    selector: 'orders-today',
    templateUrl: './orders-today.component.html',
    styleUrls: ['./orders-today.component.scss']
})
export class OrdersTodayComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _userDetailSubscription: Subscription;
    private _usersSubscription: Subscription;
    private _orderSubscription: Subscription;
    //private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _ordersCount: number = 0;
    private _orders: Observable<Order[]>;
    private _userDetail: UserDetail;

    private _userFilter: string = "";

    constructor(public _translate: TranslateService,
        private _userLanguageService: UserLanguageService,
        private _ngZone: NgZone) {
    }

    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._usersSubscription = MeteorObservable.subscribe('getUsers').subscribe();
        this._orderSubscription = MeteorObservable.subscribe('getOrdersByEstablishmentWork', this._user, ['ORDER_STATUS.RECEIVED']).subscribe(() => {
            this._ngZone.run(() => {
                //this.doFilter(null);
                this._orders = Orders.find({}).zone();
            });
        });
    }

    doFilter(_pSearchValue: string) {
        let _lToday: Date = new Date();
        _lToday.setSeconds(0);
        _lToday.setMinutes(0);
        _lToday.setHours(0);

        if (_pSearchValue) {
            let _lUserFilter = Users.findOne({ username: { $regex: _pSearchValue } });
            if (_lUserFilter) {
                this._orders = Orders.find({ creation_user: _lUserFilter._id, creation_date: { $gt: _lToday } }).zone();
                let _orders = Orders.collection.find({ creation_user: _lUserFilter._id, creation_date: { $gt: _lToday } }).count();
            }
        } else {
            console.log('llega por acá');
            this._orders = Orders.find({}).zone();
        }
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        //this.ngUnsubscribe.next();
        //this.ngUnsubscribe.complete();
        if (this._userDetailSubscription){ this._userDetailSubscription.unsubscribe()};
        if (this._orderSubscription){ this._orderSubscription.unsubscribe()};
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}