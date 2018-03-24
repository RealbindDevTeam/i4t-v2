import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from "meteor-rxjs";
import { Subscription, Subject } from "rxjs";
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Establishments } from "../../../../../../../both/collections/establishment/establishment.collection";
import { Tables } from '../../../../../../../both/collections/establishment/table.collection';
import { WaiterCallDetail } from '../../../../../../../both/models/establishment/waiter-call-detail.model';
import { WaiterCallDetails } from '../../../../../../../both/collections/establishment/waiter-call-detail.collection';
import { User } from '../../../../../../../both/models/auth/user.model';
import { Users } from '../../../../../../../both/collections/auth/user.collection';
import { UserDetail } from '../../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../../both/collections/auth/user-detail.collection';
import { CallCloseConfirmComponent } from '../call-close-confirm/call-close-confirm.component';
import { CustomerOrderConfirmComponent } from '../customer-order-confirm/customer-order-confirm.component';

@Component({
    selector: 'calls',
    templateUrl: './calls.component.html',
    styleUrls: ['./calls.component.scss']
})
export class CallsComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();

    private _userDetailSubscription: Subscription;
    private _userEstablishmentSubscription: Subscription;
    private _callsDetailsSubscription: Subscription;
    private _tableSubscription: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _mdDialogRef: MatDialogRef<any>;

    private _userDetail: UserDetail;
    private _establishments: any;
    private _waiterCallDetail: any;

    private _loading: boolean;
    private _thereAreCalls: boolean = true;

    /**
     * CallsComponent Constructor
     * @param {TranslateService} _translate 
     * @param {MatDialog} _mdDialog 
     * @param {UserLanguageService} _userLanguageService 
     * @param {NgZone} _ngZone
     */
    constructor(public _translate: TranslateService,
        public _mdDialog: MatDialog,
        private _userLanguageService: UserLanguageService,
        private _ngZone: NgZone) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
            if (this._userDetail) {
                this._userEstablishmentSubscription = MeteorObservable.subscribe('getEstablishmentById', this._userDetail.establishment_work).takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._establishments = Establishments.find({ _id: this._userDetail.establishment_work });
                });
            }
        });

        this._callsDetailsSubscription = MeteorObservable.subscribe('waiterCallDetailByWaiterId', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._waiterCallDetail = WaiterCallDetails.find({}).zone();
                this.countCalls();
                this._waiterCallDetail.subscribe(() => { this.countCalls(); });
            });
        });

        this._tableSubscription = MeteorObservable.subscribe('getTablesByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Count calls
     */
    countCalls(): void {
        let _lCalls: number = WaiterCallDetails.collection.find({}).count();
        _lCalls > 0 ? this._thereAreCalls = true : this._thereAreCalls = false;
    }

    /**
     * This function show a modal dialog to confirm the operation
     * @param {any} _call
     */
    showConfirm(_call: WaiterCallDetail) {
        this._mdDialogRef = this._mdDialog.open(CallCloseConfirmComponent, {
            disableClose: true
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                this._loading = true;
                setTimeout(() => {
                    MeteorObservable.call('closeWaiterCall', _call).subscribe(() => {
                        this._loading = false;
                    });
                }, 1500);
            }
        });
    }

    /**
     * This function show modal dialog with customer order information
     * @param {WaiterCallDetail} _call 
     */
    showCustomerOrder(_call: WaiterCallDetail): void {
        this._mdDialogRef = this._mdDialog.open(CustomerOrderConfirmComponent, {
            disableClose: true
        });
        this._mdDialogRef.componentInstance.call = _call;
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = null;
        });
    }

    getTableNumber(_idTable: string): number {
        let lTable = Tables.findOne({ _id: _idTable });
        if (lTable) {
            return lTable._number;
        } else {
            return 0;
        }
    }

    /**
     * NgOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}