import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../services/general/user-language.service';
import { Item } from '../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../both/collections/menu/item.collection';
import { UserDetail } from '../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { Recommended } from '../../administrator/menu/items/item/recommended/recommended.component';

@Component({
    selector: 'item-enable-sup',
    templateUrl: './items-enable-sup.component.html',
    styleUrls: ['./items-enable-sup.component.scss']
})
export class ItemEnableSupComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _itemsSub: Subscription;
    private _userDetailSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    public _dialogRef: MatDialogRef<any>;

    private _items: Observable<Item[]>;
    private _itemsFilter: Item[] = [];
    private _userDetail: UserDetail;
    private _thereAreItems: boolean = true;

    /**
    * ItemEnableSupComponent Constructor
    * @param _translate 
    * @param _ngZone 
    * @param _userLanguageService 
    * @param _dialog 
    * @param snackBar 
    */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        public _dialog: MatDialog,
        public snackBar: MatSnackBar) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._itemsSub = MeteorObservable.subscribe('getItemsByUserEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
                this._itemsFilter = Items.collection.find({}).fetch();
                this.countItems();
                this._items.subscribe(() => { this.countItems(); });
            });
        });
        this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetail = UserDetails.collection.findOne({ user_id: this._user });
            });
        });
    }

    /**
     * Validate if items exists
     */
    countItems(): void {
        Items.collection.find({}).count() > 0 ? this._thereAreItems = true : this._thereAreItems = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Update item available flag
     * @param {Item} _item 
     */
    updateAvailableFlag(_itemId: string): void {
        let snackMsg: string = this.itemNameTraduction('ENABLE_DISABLED.AVAILABILITY_CHANGED');
        if (this._userDetail) {
            MeteorObservable.call('updateItemAvailable', this._userDetail.establishment_work, _itemId).subscribe();
            this.snackBar.open(snackMsg, '', {
                duration: 1000,
            });
        }
    }

    /**
    * Function to update de item establishments recommendation
    * @param _pItemId 
    */
    updateRecommendedFlag(_pItemId: string) {
        let snackMsg: string = this.itemNameTraduction('ITEMS.RECOMMENDED_CHANGED');
        MeteorObservable.call('updateRecommended', this._userDetail.establishment_work, _pItemId).subscribe();
        this.snackBar.open(snackMsg, '', {
            duration: 1000,
        });
    }

    /**
     * Get the item available for the supervisor establishment
     */
    getItemAvailable(_item: Item): boolean {
        let _itemEstablishment;
        if (this._userDetail) {
            _itemEstablishment = Items.collection.findOne({ _id: _item._id }, { fields: { _id: 0, establishments: 1 } });
            let aux = _itemEstablishment.establishments.find(element => element.establishment_id === this._userDetail.establishment_work);
            return aux.isAvailable;
        } else {
            return;
        }
    }

    /**
     * Get the item recommendation for the supervisor establishment
     */
    getItemRecommendation(_item: Item): boolean {
        let _itemEstablishment;
        if (this._userDetail) {
            _itemEstablishment = Items.collection.findOne({ _id: _item._id }, { fields: { _id: 0, establishments: 1 } });
            let aux = _itemEstablishment.establishments.find(element => element.establishment_id === this._userDetail.establishment_work);
            return aux.recommended;
        } else {
            return;
        }
    }

    /**
     * Show Recommended dialog
     * @param _pItem 
     */
    openRecommendDialog(_pItem: Item) {
        this._dialogRef = this._dialog.open(Recommended, {
            disableClose: true,
            data: {
                item: _pItem
            }
        });
    }

    /**
     * This function cleans the tables_number fields form
     * @param {string} itemName
     * @return {string}
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}
