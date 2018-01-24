import { Component, OnInit, OnDestroy, NgZone, Input } from '@angular/core';
import { MeteorObservable } from "meteor-rxjs";
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable } from 'rxjs';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { OrderHistory } from '../../../../../../../both/models/establishment/order-history.model';
import { OrderHistories } from '../../../../../../../both/collections/establishment/order-history.collection';

@Component({
    selector: 'points-detail',
    templateUrl: './points-detail.component.hmtl',
    styleUrls: ['./points-detail.component.scss']
})
export class PointsDetailComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _orderHistorySub: Subscription;

    private _orderHistories: Observable<OrderHistory[]>;
    private _establishmentId: string;

    /**
     * PointsDetailComponent constructor
     * @param {NgZone} _ngZone 
     * @param {TranslateService} _translate 
     * @param {UserLanguageService} _userLanguageService 
     * @param {Router} _router 
     * @param {ActivatedRoute} _activatedRoute
     * @param {Location} _location
     */
    constructor(private _ngZone: NgZone,
        public _translate: TranslateService,
        private _userLanguageService: UserLanguageService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private readonly _location: Location) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this._activatedRoute.params.forEach((params: Params) => {
            this._establishmentId = params['param1'];
        });
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._location.replaceState("/app/establishment-points");
        this.removeSubscriptions();
        if (this._establishmentId !== null && this._establishmentId !== undefined) {
            this._orderHistorySub = MeteorObservable.subscribe('getOrdersHistoryByUserId', this._user, this._establishmentId).subscribe(() => {
                this._ngZone.run(() => {
                    this._orderHistories = OrderHistories.find({ customer_id: this._user, establishment_id: this._establishmentId }).zone();
                });
            });
        } else {
            if (Meteor.user() !== undefined && Meteor.user() !== null) {
                this._router.navigate(['/app/orders']);
            } else {
                this._router.navigate(['/app/orders']);
            }
        }
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._orderHistorySub) { this._orderHistorySub.unsubscribe(); }
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}