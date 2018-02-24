import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable, Subject } from 'rxjs';
import { UserDetail } from 'i4t_web/both/models/auth/user-detail.model';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { WaiterCallPage } from '../waiter-call/waiter-call';
import { ChangeTablePage } from '../options/table-change/table-change';
import { EstablishmentExitPage } from './establishment-exit/establishment-exit';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { WaiterCallDetail } from 'i4t_web/both/models/establishment/waiter-call-detail.model';
import { WaiterCallDetails } from 'i4t_web/both/collections/establishment/waiter-call-detail.collection';

@Component({
    selector: 'page-options',
    templateUrl: 'options.html'
})
export class OptionsPage implements OnInit, OnDestroy {

    private _userDetailSub: Subscription;
    private _waiterCallDetailSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _waiterCallsDetails: Observable<WaiterCallDetail[]>;
    private _userDetail: UserDetail;
    private _showWaiterAlert: boolean = false;

    /**
     * OptionsPage constructor
     */
    constructor(public _navCtrl: NavController,
        public _navParams: NavParams,
        private _ngZone: NgZone,
        private _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider) {
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.init();
    }

    /**
   * ionViewWillEnter implementation
   */
    ionViewWillEnter() {
        this.init();
    }

    init() {
        this.removeSubscriptions();
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
            });
        });
        this._waiterCallDetailSub = MeteorObservable.subscribe('countWaiterCallDetailByUsrId', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._waiterCallsDetails = WaiterCallDetails.find({ user_id: Meteor.userId(), type: 'CALL_OF_CUSTOMER', establishment_id: this._userDetail.current_establishment, status: { $in: ["waiting", "completed"] } }).zone();
                this.countWaiterCalls();
                this._waiterCallsDetails.subscribe(() => { this.countWaiterCalls(); });
            });
        });
    }

    /**
   * Remove all subscriptions
   */
    removeSubscriptions() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**		
    * Count Waiter Calls		
    */
    countWaiterCalls(): void {
        let _lWaiterCalls: number = WaiterCallDetails.collection.find({ user_id: Meteor.userId(), type: 'CALL_OF_CUSTOMER', establishment_id: this._userDetail.current_establishment, status: { $in: ["waiting", "completed"] } }).count();
        _lWaiterCalls > 0 ? this._showWaiterAlert = true : this._showWaiterAlert = false;
    }

    /**
     * Go to waiter call page
     */
    goToWaiterCall() {
        this._navCtrl.push(WaiterCallPage);
    }

    /**
     * Go to change table page
     */
    goToChangeTable() {
        this._navCtrl.push(ChangeTablePage, { res_id: this._userDetail.current_establishment, table_id: this._userDetail.current_table });
    }

    /**
     * Go to establishment exit page
     */
    goToEstablishmentExit() {
        this._navCtrl.push(EstablishmentExitPage, { res_id: this._userDetail.current_establishment, table_id: this._userDetail.current_table });
    }

    /**
   * This function allow translate strings
   * @param {string} _itemName 
   */
    itemNameTraduction(_itemName: string): string {
        var wordTraduced: string;
        this._translate.get(_itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
   * ionViewWillLeave implementation
   */
    ionViewWillLeave() {
        this.removeSubscriptions();
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}