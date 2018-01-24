import { Component, OnInit, OnDestroy, NgZone, Input } from '@angular/core';
import { MeteorObservable } from "meteor-rxjs";
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable } from 'rxjs';
import { Router } from "@angular/router";
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Order } from '../../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../../both/collections/establishment/order.collection';

@Component({
    selector: 'points-detail',
    templateUrl: './points-detail.component.hmtl',
    styleUrls: ['./points-detail.component.scss']
})
export class PointsDetailComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _ordersSub: Subscription;

    private _orders: Observable<Order[]>;

    /**
     * PointsDetailComponent constructor
     * @param {NgZone} _ngZone 
     * @param {TranslateService} _translate 
     * @param {UserLanguageService} _userLanguageService 
     * @param {Router} _router 
     */
    constructor(private _ngZone: NgZone,
        public _translate: TranslateService,
        private _userLanguageService: UserLanguageService,
        private _router: Router) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._ordersSub = MeteorObservable.subscribe('getOrdersHistoryByUserId', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._orders = Orders.find({ creation_user: this._user }).zone();
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}