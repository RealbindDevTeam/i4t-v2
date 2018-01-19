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
        scaleShowHorizontalLines: false,
        responsive: true,
        scales: {
            yAxes: [{
                stacked: true,
                barPercentage: 0.5
            }]
        }
    }

    public barChartLabels: string[] = [];
    public barChartType: string = 'horizontalBar';
    public barChartLegend: boolean = false;

    public barChartData: any[] = [{ data: [] }];
    private _itemsSubscription: Subscription;
    private _ordersSubscription: Subscription;

    private _items: Observable<Item[]>;
    private _orders: Observable<Order[]>;


    /**
     * BarChartItemsComponent constructor
     * @param {NgZone} _ngZone 
     */
    constructor(private _ngZone: NgZone) {
    }

    /**
     * NgOnInit Implementation
     */
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
                let todayDate = new Date();
                this._orders = Orders.find({}).zone();
                this._orders.subscribe(() => {
                    this.setBarChartData();
                });
            });
        })
    }

    /**
     * Set the chart labels
     */
    setBarCharLabels() {
        this.barChartLabels = [];
        Items.collection.find({}).fetch().forEach((item) => {
            this.barChartLabels.push(item.name);
        });
    }

    /**
     * Set chart data 
     */
    setBarChartData() {
        this.barChartData = [];
        let _lData: number[] = [];
        Items.collection.find().fetch().forEach((item) => {
            let _lAggregate: number = 0;
            let todayDate = new Date();
            Orders.collection.find({ 'items.itemId': item._id, 'creation_date': { $gte: new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()) } }).fetch().forEach(order => {
                order.items.forEach((itemObject) => {
                    if (itemObject.itemId === item._id) {
                        _lAggregate = _lAggregate + itemObject.quantity;
                    }
                });
            });
            _lData.push(_lAggregate);
        });
        this.barChartData = [{ data: _lData, label: 'Cant.' }];
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._itemsSubscription) { this._itemsSubscription.unsubscribe(); }
        if (this._ordersSubscription) { this._ordersSubscription.unsubscribe(); }
    }

    /**
     * NgOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }

}