import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { Router } from "@angular/router";
import { UserLanguageService } from '../../services/general/user-language.service';
import { Order, OrderItem } from '../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../both/collections/establishment/order.collection';
import { Item } from '../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../both/collections/menu/item.collection';
import { Reward } from '../../../../../../both/models/establishment/reward.model';
import { Rewards } from '../../../../../../both/collections/establishment/reward.collection';

@Component({
    selector: 'rewards-detail',
    templateUrl: './rewards-detail.component.html',
    styleUrls: ['./rewards-detail.component.scss']
})
export class RewardsDetailComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _establishmentId: string;
    private _tableQRCode: string;

    private _rewardsSub: Subscription;
    private _ordersSub: Subscription;
    private _itemsSub: Subscription;

    private _rewards: Observable<Reward[]>;
    private _items: Observable<Item[]>;
    private _orders: Observable<Order[]>;

    /**
     * RewardsDetailComponent constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {MatSnackBar} _snackBar 
     * @param {UserLanguageService} _userLanguageService 
     * @param {MatDialogRef<any>} _dialogRef 
     * @param {Router} _router 
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        public _snackBar: MatSnackBar,
        private _userLanguageService: UserLanguageService,
        public _dialogRef: MatDialogRef<any>,
        private _router: Router) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._rewardsSub = MeteorObservable.subscribe('getEstablishmentRewards', this._establishmentId).subscribe(() => {
            this._ngZone.run(() => {
                this._rewards = Rewards.find({ establishments: { $in: [this._establishmentId] } }).zone();
            });
        });
        this._ordersSub = MeteorObservable.subscribe('getOrders', this._establishmentId, this._tableQRCode, ['ORDER_STATUS.SELECTING', 'ORDER_STATUS.CONFIRMED']).subscribe(() => {
            this._ngZone.run(() => {
                this._orders = Orders.find({ creation_user: this._user }).zone();
            });
        });
        this._itemsSub = MeteorObservable.subscribe('itemsByEstablishment', this._establishmentId).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._rewardsSub) { this._rewardsSub.unsubscribe(); }
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._itemsSub) { this._itemsSub.unsubscribe(); }
    }

    /**
     * Function to get item avalaibility 
     */
    getItemAvailability(itemId: string): boolean {
        let _itemEstablishment: Item = Items.collection.findOne({ _id: itemId }, { fields: { _id: 0, establishments: 1 } });
        let aux = _itemEstablishment.establishments.find(element => element.establishment_id === this._establishmentId);
        return aux.isAvailable;
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}