import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef } from '@angular/material';
import { Observable, Subscription } from 'rxjs';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { WaiterCallDetail } from '../../../../../../../both/models/restaurant/waiter-call-detail.model';
import { Order } from '../../../../../../../both/models/restaurant/order.model';
import { Orders } from '../../../../../../../both/collections/restaurant/order.collection';
import { Users } from '../../../../../../../both/collections/auth/user.collection';
import { User } from '../../../../../../../both/models/auth/user.model';
import { Item } from '../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../both/collections/menu/item.collection';
import { Table } from '../../../../../../../both/models/restaurant/table.model';
import { Tables } from '../../../../../../../both/collections/restaurant/table.collection';
import { Addition } from '../../../../../../../both/models/menu/addition.model';
import { Additions } from '../../../../../../../both/collections/menu/addition.collection';
import { GarnishFood } from '../../../../../../../both/models/menu/garnish-food.model';
import { GarnishFoodCol } from '../../../../../../../both/collections/menu/garnish-food.collection';

@Component({
    selector: 'send-order-confirm',
    templateUrl: './send-order-confirm.component.html',
    styleUrls: ['./send-order-confirm.component.scss'],
    providers: [UserLanguageService]
})
export class SendOrderConfirmComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    public call: WaiterCallDetail;

    private _ordersSub: Subscription;
    private _usersSub: Subscription;
    private _itemsSub: Subscription;
    private _tablesSub: Subscription;
    private _additionsSub: Subscription;
    private _garnishFoodSub: Subscription;

    private _orders: Observable<Order[]>;
    private _items: Observable<Item[]>;
    private _additions: Observable<Addition[]>;
    private _garnishFood: Observable<GarnishFood[]>;

    private _tableNumber: string;
    private _tableQRCode: string;
    private _loading: boolean = false;

    /**
     * SendOrderConfirmComponent constructor
     * @param {TranslateService} translate
     * @param {MatDialogRef<any>} _dialogRef
     * @param {NgZone} _ngZone
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _translate: TranslateService,
        public _dialogRef: MatDialogRef<any>,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._ordersSub = MeteorObservable.subscribe('getOrderById', this.call.order_id).subscribe(() => {
            this._ngZone.run(() => {
                this._orders = Orders.find({}).zone();
            });
        });

        this._usersSub = MeteorObservable.subscribe('getUserByTableId', this.call.restaurant_id, this.call.table_id).subscribe();

        this._itemsSub = MeteorObservable.subscribe('itemsByRestaurant', this.call.restaurant_id).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
            });
        });

        this._tablesSub = MeteorObservable.subscribe('getTablesByRestaurant', this.call.restaurant_id).subscribe(() => {
            this._ngZone.run(() => {
                let _lTable: Table = Tables.collection.find({ _id: this.call.table_id }).fetch()[0];
                this._tableNumber = _lTable._number + '';
                this._tableQRCode = _lTable.QR_code;
            });
        });

        this._additionsSub = MeteorObservable.subscribe('additionsByRestaurant', this.call.restaurant_id).subscribe(() => {
            this._ngZone.run(() => {
                this._additions = Additions.find({}).zone();
            });
        });

        this._garnishFoodSub = MeteorObservable.subscribe('garnishFoodByRestaurant', this.call.restaurant_id).subscribe(() => {
            this._ngZone.run(() => {
                this._garnishFood = GarnishFoodCol.find({}).zone();
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._usersSub) { this._usersSub.unsubscribe(); }
        if (this._itemsSub) { this._itemsSub.unsubscribe(); }
        if (this._tablesSub) { this._tablesSub.unsubscribe(); }
        if (this._additionsSub) { this._additionsSub.unsubscribe(); }
        if (this._garnishFoodSub) { this._garnishFoodSub.unsubscribe(); }
    }

    /**
     * Return User Name
     * @param {string} _pUserId 
     */
    getUserName(_pUserId: string): string {
        let _user: User = Users.collection.find({}).fetch().filter(u => u._id === _pUserId)[0];
        if (_user) {
            if (_user.username) {
                return _user.username;
            }
            else if (_user.profile.name) {
                return _user.profile.name;
            }
        }
    }

    /**
     * Close PaymentConfirm Dialog
     */
    close(): void {
        this._dialogRef.close();
    }

    /**
     * Function set order status to delivered
     */
    closeCall(): void {
        this._loading = true;
        setTimeout(() => {
            MeteorObservable.call('closeCall', this.call, this._user).subscribe(() => {
                this._loading = false;
                this.close();
            });
        }, 1500);
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}