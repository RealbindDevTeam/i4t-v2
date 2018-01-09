import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Order, OrderItem } from 'i4t_web/both/models/establishment/order.model';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { ItemEstablishment } from 'i4t_web/both/models/menu/item.model';

@Component({
    selector: 'order-item-detail',
    templateUrl: 'order-item-detail.html'
})

export class OrderItemDetailComponent implements OnInit, OnDestroy {
    @Input()
    order: Order;

    @Input()
    orderItem: OrderItem;

    @Input()
    resCode: string;

    @Input()
    currency: string;

    @Output('gotoedititem')
    itemIdOut: EventEmitter<any> = new EventEmitter<any>();

    private _items;
    private _itemsSub: Subscription;
    private _currentOrderUserId: string;

    constructor() {
        this._currentOrderUserId = Meteor.userId();
    }

    ngOnInit() {
        this._itemsSub = MeteorObservable.subscribe('itemsByUser', Meteor.userId()).subscribe(() => {
            this._items = Items.find({ _id: this.orderItem.itemId });
        });
    }

    goToItemEdit(itemId, orderItemIndex) {
        let arrValue: any[] = [];
        arrValue[0] = itemId;
        arrValue[1] = orderItemIndex;
        this.itemIdOut.emit(arrValue);
    }

    /**
    * Function to get item avalaibility 
    */
    getItemAvailability(itemId: string): boolean {
        let _item = Items.find().fetch().filter((i) => i._id === itemId)[0];
        if( _item ){
            return ( _item.establishments.filter( r => r.establishment_id === this.resCode )[0] ).isAvailable;
        }
    }

    ngOnDestroy() {
        if( this._itemsSub ){ this._itemsSub.unsubscribe(); }
    }

    ionViewWillLeave() {
        if( this._itemsSub ){ this._itemsSub.unsubscribe(); }
    }
}