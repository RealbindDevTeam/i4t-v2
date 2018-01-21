import { Component, OnInit, OnDestroy, NgZone, Input } from '@angular/core';
import { MeteorObservable } from "meteor-rxjs";
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable } from 'rxjs';
import { Router } from "@angular/router";
import { UserLanguageService } from '../../services/general/user-language.service';
import { Establishment } from '../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../both/collections/establishment/establishment.collection';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../both/models/auth/user-detail.model';

@Component({
    selector: 'customer-points',
    templateUrl: './customer-points.component.html',
    styleUrls: ['./customer-points.component.scss']
})
export class CustomerPointsComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _userDetailsSub: Subscription;
    private _establishmentsSub: Subscription;

    private _userDetails: Observable<UserDetail[]>;
    private _establishments: Observable<Establishment[]>;

    private _userDetail: UserDetail;
    private _showEstablishments: boolean = true;

    /**
     * CustomerPointsComponent constructor
     * @param {NgZone} _ngZone 
     * @param {TranslateService} _translate 
     * @param {UserLanguageService} _userLanguageService 
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
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByUser', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetails = UserDetails.find({ user_id: this._user }).zone();
                this.validateUserEstablishments();
                this._userDetails.subscribe(() => { this.validateUserEstablishments(); });
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._userDetailsSub) { this._userDetailsSub.unsubscribe(); }
        if (this._establishmentsSub) { this._establishmentsSub.unsubscribe(); }
    }

    /**
     * Validate establishment where user accumulate points
     */
    validateUserEstablishments(): void {
        if (this._establishmentsSub) { this._establishmentsSub.unsubscribe(); }
        this._userDetail = UserDetails.findOne({ user_id: this._user });

        if (this._userDetail) {
            if (this._userDetail.reward_points !== null && this._userDetail.reward_points !== undefined) {
                let _lEstablishmentsIds: string[] = [];
                UserDetails.findOne({ user_id: this._user }).reward_points.forEach((p) => {
                    _lEstablishmentsIds.push(p.establishment_id);
                });
                this._establishmentsSub = MeteorObservable.subscribe('getEstablishmentsByIds', _lEstablishmentsIds).subscribe(() => {
                    this._ngZone.run(() => {
                        this._establishments = Establishments.find({}).zone();
                    });
                });
                this._showEstablishments = true;
            } else {
                this._showEstablishments = false;
            }
        }
    }

    /**
     * Open establishment detail
     * @param {string} _establishmentId 
     */
    openEstablishmentDetail(_establishmentId: string): void {
        
    }

    /**
     * Go to Orders
     */
    goToOrders(): void {
        this._router.navigate(['app/orders']);
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}