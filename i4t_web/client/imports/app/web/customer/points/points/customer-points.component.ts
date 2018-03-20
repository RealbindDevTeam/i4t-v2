import { Component, OnInit, OnDestroy, NgZone, Input } from '@angular/core';
import { MeteorObservable } from "meteor-rxjs";
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable, Subject } from 'rxjs';
import { Router } from "@angular/router";
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { UserDetails } from '../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../both/models/auth/user-detail.model';
import { RewardPoints } from '../../../../../../../both/collections/establishment/reward-point.collection';
import { RewardPoint } from '../../../../../../../both/models/establishment/reward-point.model';

@Component({
    selector: 'customer-points',
    templateUrl: './customer-points.component.html',
    styleUrls: ['./customer-points.component.scss']
})
export class CustomerPointsComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _userDetailsSub: Subscription;
    private _establishmentsSub: Subscription;
    private _rewardPointsSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

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
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByUser', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetails = UserDetails.find({ user_id: this._user }).zone();
                this.validateUserEstablishments();
                this._userDetails.subscribe(() => { this.validateUserEstablishments(); });
            });
        });
        this._rewardPointsSub = MeteorObservable.subscribe('getRewardPointsByUserId', this._user).takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
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
                this._establishmentsSub = MeteorObservable.subscribe('getEstablishmentsByIds', _lEstablishmentsIds).takeUntil(this._ngUnsubscribe).subscribe(() => {
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
     * Validate if user have points in a especific establishment
     * @param {string} _pEstablishmentId 
     */
    validateEstablishmentExpirePoints(_pEstablishmentId: string): boolean {
        let _RewardPoints: RewardPoint;
        _RewardPoints = RewardPoints.collection.find({ id_user: this._user, establishment_id: _pEstablishmentId, is_active: true }).fetch()[0];
        if (_RewardPoints) {
            let _points: number = 0;
            _points = _RewardPoints.points;
            if (_points <= 0) {
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }

    /**
     * Return points to expire
     * @param {string} _pEstablishmentId 
     */
    getEstablishmentExpirePoints(_pEstablishmentId: string): number {
        return RewardPoints.collection.find({ id_user: this._user, establishment_id: _pEstablishmentId, is_active: true }).fetch()[0].points;
    }

    /**
     * Return expiration points date
     * @param {string} _pEstablishmentId 
     */
    getEstablishmentExpirePointsDate(_pEstablishmentId: string): Date {
        return RewardPoints.collection.find({ id_user: this._user, establishment_id: _pEstablishmentId, is_active: true }).fetch()[0].expire_date;
    }

    /**
     * Open establishment detail
     * @param {string} _establishmentId 
     */
    openEstablishmentDetail(_establishmentId: string): void {
        this._router.navigate(['app/establishment-points', _establishmentId]);
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