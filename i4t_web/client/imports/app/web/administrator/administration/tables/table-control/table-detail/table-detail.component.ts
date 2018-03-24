import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MatDialogRef, MatDialog } from '@angular/material';
import { UserLanguageService } from '../../../../../services/general/user-language.service';
import { User } from '../../../../../../../../../both/models/auth/user.model';
import { Users } from '../../../../../../../../../both/collections/auth/user.collection';
import { UserDetail, UserDetailImage } from '../../../../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../../../../both/collections/auth/user-detail.collection';
import { Order } from '../../../../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../../../../both/collections/establishment/order.collection';
import { PenalizeCustomerComponent } from './penalize-customer/penalize-customer.component';

@Component({
    selector: 'table-detail',
    templateUrl: './table-detail.component.html',
    styleUrls: ['./table-detail.component.scss']
})
export class TableDetailComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _establishmentId: string;
    private _tableId: string;
    private _tableNumber: string;
    private _currencyId: string;
    private _role: string;

    private _usersSub: Subscription;
    private _userDetailsSub: Subscription;
    private _ordersSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _userDetails: Observable<UserDetail[]>;
    private _users: Observable<User[]>;
    public _dialogRef: MatDialogRef<any>;

    /**
     * TableDetailComponent Constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService 
     * @param {ActivatedRoute} _route
     * @param {Router} _router
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        private _route: ActivatedRoute,
        private _router: Router,
        public _dialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this._route.params.forEach((params: Params) => {
            this._establishmentId = params['param1'];
            this._tableId = params['param2'];
            this._tableNumber = params['param3'];
            this._currencyId = params['param4'];
            this._role = params['param5'];
        });
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removesubscriptions();
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByCurrentTable', this._establishmentId, this._tableId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetails = UserDetails.find({ current_establishment: this._establishmentId, current_table: this._tableId }).zone();
            });
        });
        this._usersSub = MeteorObservable.subscribe('getUserByTableId', this._establishmentId, this._tableId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._users = Users.find({}).zone();
            });
        });
        this._ordersSub = MeteorObservable.subscribe('getOrdersByTableId', this._establishmentId, this._tableId,
            ['ORDER_STATUS.REGISTERED', 'ORDER_STATUS.IN_PROCESS',
                'ORDER_STATUS.PREPARED', 'ORDER_STATUS.DELIVERED',
                'ORDER_STATUS.PENDING_CONFIRM']).takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removesubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Return user image
     * @param {User} _pUser 
     */
    getUserImage(_pUser: User): string {
        if (_pUser.services.facebook) {
            return "http://graph.facebook.com/" + _pUser.services.facebook.id + "/picture/?type=large";
        } else {
            let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: Meteor.userId() });
            if (_lUserDetail) {
                let _lUserDetailImage: UserDetailImage = _lUserDetail.image;
                if (_lUserDetailImage) {
                    return _lUserDetailImage.url;
                } else {
                    return '/images/user_default_image.png';
                }
            }
            else {
                return '/images/user_default_image.png';
            }
        }
    }

    /**
     * Return to Table Control
     */
    returnTableControl(): void {
        if (this._role === '100') { this._router.navigate(['app/establishment-table-control']); }
        if (this._role === '600') { this._router.navigate(['app/supervisor-establishment-table-control']); }
    }

    /**
     * When user wants penalize customer
     * @param {User} _pUser
     */
    openCustomerPenalize(_pUser: User) {
        this._dialogRef = this._dialog.open(PenalizeCustomerComponent, {
            disableClose: true,
            width: '60%'
        });
        this._dialogRef.componentInstance._user = _pUser;
        this._dialogRef.componentInstance._establishmentId = this._establishmentId;
        this._dialogRef.componentInstance._tableId = this._tableId;
        this._dialogRef.componentInstance._urlImage = this.getUserImage(_pUser);
        this._dialogRef.componentInstance._tableNumber = this._tableNumber;
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = null;
        });
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removesubscriptions();
    }
}