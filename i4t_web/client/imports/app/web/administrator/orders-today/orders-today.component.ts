import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription, Subject } from "rxjs";
import { UserLanguageService } from '../../services/general/user-language.service';
import { Order } from '../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../both/collections/establishment/order.collection';
import { UserDetail } from '../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';

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
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _orders: Observable<Order[]>;
    private _userDetail: UserDetail;

    constructor(public _translate: TranslateService,
        private _userLanguageService: UserLanguageService,
        private _ngZone: NgZone) {
    }

    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
                if (this._userDetail) {
                    this._orderSubscription = MeteorObservable.subscribe('getOrdersByEstablishmentWork', this._user, ['ORDER_STATUS.RECEIVED']).takeUntil(this.ngUnsubscribe).subscribe();
                    this._usersSubscription = MeteorObservable.subscribe('getUsers').takeUntil(this.ngUnsubscribe).subscribe();
                }
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    ngOnDestroy() {
    }
}