import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { MatDialogRef, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Item } from '../../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../../both/collections/menu/item.collection';
import { EnableConfirmComponent } from './enable-confirm/enable-confirm.component';

@Component({
    selector: 'item-enable',
    templateUrl: './items-enable.component.html',
    styleUrls: ['../item/item.component.scss']
})
export class ItemEnableComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _itemsSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _items: Observable<Item[]>;
    private _mdDialogRef: MatDialogRef<any>;
    private _thereAreItems: boolean = true;

    /**
     * ItemEnableComponent Constructor
     * @param {TranslateService} _translate
     * @param {NgZone} _ngZone
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        public _mdDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._itemsSub = MeteorObservable.subscribe('items', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
                this.countItems();
                this._items.subscribe(() => { this.countItems(); });
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
     * Opens dialog to enable/disable item in establishments
     */
    openDialog(_item: Item) {
        this._mdDialogRef = this._mdDialog.open(EnableConfirmComponent, {
            disableClose: true,
            data: {
                one: _item
            },
            width: '50%'
        });
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}