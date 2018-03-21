import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { NavController, AlertController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription, Observable, Subject } from 'rxjs';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { Establishment } from 'i4t_web/both/models/establishment/establishment.model';
import { Establishments } from 'i4t_web/both/collections/establishment/establishment.collection';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { UserDetail } from 'i4t_web/both/models/auth/user-detail.model';
import { RewardPoints } from 'i4t_web/both/collections/establishment/reward-point.collection';
import { RewardPoint } from 'i4t_web/both/models/establishment/reward-point.model';
import { PointsDetailPage } from '../points-detail/points-detail';
import { Network } from '@ionic-native/network';

@Component({
    selector: 'points',
    templateUrl: 'points.html'
})
export class PointsPage implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _userDetailsSub: Subscription;
    private _establishmentsSub: Subscription;
    private _rewardPointsSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _userDetails: Observable<UserDetail[]>;
    private _establishments: Observable<Establishment[]>;

    private _userDetail: UserDetail;
    private _showEstablishments: boolean = true;

    private disconnectSubscription: Subscription;

    /**
     * PointsPage constructor
     * @param {NavController} _navCtrl
     * @param {TranslateService} _translate 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {NgZone} _ngZone 
     */
    constructor(public _navCtrl: NavController,
        public _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone, public _alertCtrl: AlertController,
        public _platform: Platform, private _network: Network) {
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByUser', this._user).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetails = UserDetails.find({ user_id: this._user }).zone();
                this.validateUserEstablishments();
                this._userDetails.subscribe(() => { this.validateUserEstablishments(); });
            });
        });
        this._rewardPointsSub = MeteorObservable.subscribe('getRewardPointsByUserId', this._user).takeUntil(this.ngUnsubscribe).subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
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
                this._establishmentsSub = MeteorObservable.subscribe('getEstablishmentsByIds', _lEstablishmentsIds).takeUntil(this.ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this._establishments = Establishments.find({}).zone();
                    });
                });
                this._showEstablishments = true;
            } else {
                this._showEstablishments = false;
            }
        } else {
            this._showEstablishments = false;
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
        this._navCtrl.push(PointsDetailPage, { _establishment_id: _establishmentId });
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

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}