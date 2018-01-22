import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MeteorObservable, MongoObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { Item } from '../../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../../both/collections/menu/item.collection';
import { Order } from '../../../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../../../both/collections/establishment/order.collection';

@Component({
    selector: 'chart-detail',
    templateUrl: './chart-detail.component.html',
    styleUrls: ['./chart-detail.component.scss']
})
export class ChartDetailComponent implements OnInit, OnDestroy {

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

    private _dataSelect = [];
    private _dateIni: Date;
    private _dateEnd: Date;
    private _selected: string;
    private _today: string = "today";
    private _yesterday: string = "yesterday";
    private establishmentId: string;

    constructor(private _activatedRoute: ActivatedRoute,
        private _ngZone: NgZone,
        private _translate: TranslateService) {
        this._activatedRoute.params.forEach((params: Params) => {
            this.establishmentId = params['param1'];
        });

        this._selected = this._today;
        this._dateIni = new Date();
        this._dateEnd = new Date();
    }


    /**
     * NgOnInit Implementation
     */
    ngOnInit() {
        this._dataSelect = [
            { value: this._today, viewValue: this.itemNameTraduction('CHART_DETAIL.TODAY') },
            { value: this._yesterday, viewValue: this.itemNameTraduction('CHART_DETAIL.YESTERDAY') }
        ];
        
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
     * Change date range
     * @param _pOption 
     */
    changeDateRange(_pOption: string) {
        if (_pOption === this._today) {
            this._dateIni = new Date();
            this._dateEnd = new Date();
        } else if (_pOption === this._yesterday) {
            this._dateIni = new Date(this._dateIni.getFullYear(), this._dateIni.getMonth(), this._dateIni.getDate() - 1);
            this._dateEnd = new Date(this._dateEnd.getFullYear(), this._dateEnd.getMonth(), this._dateEnd.getDate() - 1);
        }
        this.setBarChartData();
    }

    /**
     * Set chart data 
     */
    setBarChartData() {
        this.barChartData = [];
        let _lData: number[] = [];
        Items.collection.find().fetch().forEach((item) => {
            let _lAggregate: number = 0;
            Orders.collection.find({
                'items.itemId': item._id,
                'creation_date': {
                    $gte: new Date(this._dateIni.getFullYear(), this._dateIni.getMonth(), this._dateIni.getDate()),
                    $lte: new Date(this._dateEnd.getFullYear(), this._dateEnd.getMonth(), this._dateEnd.getDate(), 23, 59, 59)
                }
            }).fetch().forEach(order => {
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
     * Function to translate information
     * @param {string} _itemName
     */
    itemNameTraduction(_itemName: string): string {
        var _wordTraduced: string;
        this._translate.get(_itemName).subscribe((res: string) => {
            _wordTraduced = res;
        });
        return _wordTraduced;
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