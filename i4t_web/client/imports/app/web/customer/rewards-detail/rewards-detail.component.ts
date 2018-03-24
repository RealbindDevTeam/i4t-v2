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
    private _userRewardPoints: number;
    private _allowAddRewardsToOrder: boolean = true;
    private _loading: boolean;

    private _rewards: Observable<Reward[]>;
    private _items: Observable<Item[]>;
    private _thereRewards: boolean = true;

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
        this._rewards = Rewards.find({ establishments: { $in: [this._establishmentId] } }, { sort: { points: 1 } }).zone();
        this._rewards.subscribe(() => {
            let count = Rewards.collection.find({ establishments: { $in: [this._establishmentId] } }, { sort: { points: 1 } }).count();
            if (count > 0) {
                this._thereRewards = false;
            } else {
                this._thereRewards = true;
            }
        });
        this._items = Items.find({}).zone();
        Orders.collection.find({ creation_user: this._user }).fetch().forEach((order) => {
            if (order.status === 'ORDER_STATUS.SELECTING') {
                order.items.forEach((it) => {
                    if (it.is_reward) {
                        this._allowAddRewardsToOrder = false;
                    }
                });
            }
        });
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
     * Add reward in order with SELECTING state
     * @param {string} _pItemToInsert
     * @param {number} _pItemQuantiy
     * @param {number} _pRewardPoints
     */
    AddRewardToOrder(_pItemToInsert: string, _pItemQuantiy: number, _pRewardPoints: number): void {
        this._loading = true;
        setTimeout(() => {
            let _lOrderItemIndex: number = 0;
            let _lOrder: Order = Orders.collection.find({ creation_user: this._user, establishment_id: this._establishmentId }).fetch()[0];

            if (_lOrder) {
                _lOrderItemIndex = _lOrder.orderItemCount + 1;
            } else {
                _lOrderItemIndex = 1;
            }

            let _lOrderItem: OrderItem = {
                index: _lOrderItemIndex,
                itemId: _pItemToInsert,
                quantity: _pItemQuantiy,
                observations: '',
                options: [],
                additions: [],
                paymentItem: 0,
                reward_points: 0,
                is_reward: true,
                redeemed_points: _pRewardPoints
            };
            MeteorObservable.call('AddItemToOrder', _lOrderItem, this._establishmentId, this._tableQRCode, 0, 0).subscribe(() => {
                this._loading = false;
                let _lMessage: string = this.itemNameTraduction('REWARD_DETAIL.REWARD_AGGREGATED');
                this._snackBar.open(_lMessage, '', { duration: 3000 });
                this._dialogRef.close();
            }, (error) => {
                this._loading = false;
                let _lMessage: string = this.itemNameTraduction('REWARD_DETAIL.ERROR');
                this._snackBar.open(_lMessage, '', { duration: 3000 });
                this._dialogRef.close();
            });
        }, 1500);
    }

    /**
     * Return traduction
     * @param {string} itemName 
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {

    }
}