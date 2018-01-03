import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Order, OrderItem } from 'i4t_web/both/models/restaurant/order.model';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs';
import { Items } from 'i4t_web/both/collections/menu/item.collection';

@Component({
    selector: 'colombia-payment-item-detail',
    templateUrl: 'colombia-payment-item-detail.html'
})

export class ColombiaPaymentItemDetailComponent implements OnInit, OnDestroy {
    @Input()
    order: Order;

    @Input()
    orderItem: OrderItem;

    @Input()
    resCode: string;
    
    @Input()
    currencyCode: string;

    private _items;
    private _itemsSub: Subscription;

    /**
     * ColombiaPaymentItemDetailsComponent constructor
     */
    constructor() {
    }

    /**
     * ngOnInit Implementation. Find the items corresponding to RestaurantId
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._itemsSub = MeteorObservable.subscribe('itemsByRestaurant', this.resCode).subscribe(() => {
            this._items = Items.find({_id: this.orderItem.itemId});
        });
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions():void{
        if( this._itemsSub ){ this._itemsSub.unsubscribe(); }
    }
}