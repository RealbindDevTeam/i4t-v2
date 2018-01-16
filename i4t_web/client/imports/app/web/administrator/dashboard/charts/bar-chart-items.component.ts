import { Component, Input, NgZone, OnInit, OnDestroy } from '@angular/core';
import { MeteorObservable, MongoObservable } from 'meteor-rxjs';
import { Observable, Subscription } from 'rxjs';

import { Item } from '../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../both/collections/menu/item.collection';
import { Order } from '../../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../../both/collections/establishment/order.collection';

@Component({
    selector: 'bar-chart-items',
    templateUrl: './bar-chart-items.component.html'
})
export class BarChartItemsComponent implements OnInit, OnDestroy {
    @Input() establishmentId: string;
    public barChartOptions: any = {
        //scaleShowVerticalLines: false,
        //responsive: true
    }

    public barChartLabels: string[] = [];
    public barChartType: string = 'horizontalBar';
    public barChartLegend: boolean = true;
    public barChartData: any[] = [{ data: [] }];

    //public barChartData: any[] = [
    //    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
    //    { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B' }
    //];

    private _itemsSubscription: Subscription;
    private _ordersSubscription: Subscription;

    private _items: Observable<Item[]>;
    private _orders: Observable<Order[]>;


    constructor(private _ngZone: NgZone) {
    }

    ngOnInit() {
        this._itemsSubscription = MeteorObservable.subscribe('itemsByEstablishment', this.establishmentId).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
                this._items.subscribe(() => {
                    this.setBarCharLabels();
                });
            });
        });

        this._ordersSubscription = MeteorObservable.subscribe('getOrdersByEstablishmentId', this.establishmentId, ['ORDER_STATUS.RECEIVED']).subscribe(() => {
            this._ngZone.run(() => {
                this._orders = Orders.find({}).zone();
                this._orders.subscribe(() => {
                    this.setBarCharLabels();
                });
            });
        })
    }

    setBarCharLabels() {
        this.barChartLabels = [];
        this.barChartData = [];
        let _lData: number[] = [];
        Items.collection.find({}).fetch().forEach((item) => {
            this.barChartLabels.push(item.name);
            //    let count = Orders.collection.find({ 'items.itemId': item._id }).count();
            //    _lData.push(count * 10);
        });
        //
        //this.barChartData = [{ data: _lData, label: 'Hola' }];
        this.barChartData = [
            { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
            { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B' }
        ];
        console.log(this.barChartLabels);
        console.log(this.barChartData);
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._itemsSubscription) { this._itemsSubscription.unsubscribe(); }
        if (this._ordersSubscription) { this._ordersSubscription.unsubscribe(); }
    }

    ngOnDestroy() {
        this.removeSubscriptions();
    }

}