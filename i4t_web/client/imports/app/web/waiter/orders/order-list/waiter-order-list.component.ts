import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { Router } from "@angular/router";
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Order, OrderItem, OrderAddition } from '../../../../../../../both/models/restaurant/order.model';
import { Orders } from '../../../../../../../both/collections/restaurant/order.collection';
import { Item } from '../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../both/collections/menu/item.collection';
import { GarnishFood } from '../../../../../../../both/models/menu/garnish-food.model';
import { GarnishFoodCol } from '../../../../../../../both/collections/menu/garnish-food.collection';
import { Addition } from '../../../../../../../both/models/menu/addition.model';
import { Additions } from '../../../../../../../both/collections/menu/addition.collection';
import { Currencies } from '../../../../../../../both/collections/general/currency.collection';
import { Restaurant } from '../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../../both/collections/restaurant/restaurant.collection';
import { Tables } from '../../../../../../../both/collections/restaurant/table.collection';
import { AlertConfirmComponent } from '../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'waiter-order-list',
    templateUrl: './waiter-order-list.html',
    styleUrls: ['./waiter-order-list.scss']
})
export class WaiterOrderListComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();

    private _restaurantSub: Subscription;
    private _tablesSub: Subscription;
    private _ordersSub: Subscription;
    private _itemsSub: Subscription;
    private _garnishFoodSub: Subscription;
    private _additionsSub: Subscription;
    private _currenciesSub: Subscription;

    private _orders: Observable<Order[]>;
    private _items: Observable<Item[]>;
    private _itemsToShowDetail: Observable<Item[]>;
    private _garnishFoodCol: Observable<GarnishFood[]>;
    private _additions: Observable<Addition[]>;
    private _additionDetails: Observable<Addition[]>;
    private _restaurants: Observable<Restaurant[]>;

    /**
     * WaiterOrderListComponent Constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {MatSnackBar} _snackBar 
     * @param {UserLanguageService} _userLanguageService 
     * @param {MatDialog} _mdDialog 
     * @param {Router} _router 
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        public _snackBar: MatSnackBar,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog,
        private _router: Router) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._restaurantSub = MeteorObservable.subscribe('getRestaurantByRestaurantWork', this._user).subscribe();
        this._tablesSub = MeteorObservable.subscribe('getTablesByRestaurantWork', this._user).subscribe();
        this._ordersSub = MeteorObservable.subscribe('getOrdersByRestaurantWork', this._user, ['ORDER_STATUS.REGISTERED', 'ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED', 'ORDER_STATUS.DELIVERED']).subscribe();
        this._itemsSub = MeteorObservable.subscribe('getItemsByRestaurantWork', this._user).subscribe();
        this._garnishFoodSub = MeteorObservable.subscribe('garnishFoodByRestaurantWork', this._user).subscribe();
        this._additionsSub = MeteorObservable.subscribe('additionsByRestaurantWork', this._user).subscribe();
        this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByRestaurantWork', this._user).subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._itemsSub) { this._itemsSub.unsubscribe(); }
        if (this._garnishFoodSub) { this._garnishFoodSub.unsubscribe(); }
        if (this._additionsSub) { this._additionsSub.unsubscribe(); }
        if (this._currenciesSub) { this._currenciesSub.unsubscribe(); }
        if (this._restaurantSub) { this._restaurantSub.unsubscribe(); }
        if (this._tablesSub) { this._tablesSub.unsubscribe(); }
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}