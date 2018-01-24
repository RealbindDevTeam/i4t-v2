import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MeteorObservable, MongoObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Item } from '../../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../../both/collections/menu/item.collection';
import { Order } from '../../../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../../../both/collections/establishment/order.collection';
import { take } from 'rxjs/operators/take';

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
    private _today: Date = new Date();
    private _dateIni: Date;
    private _dateEnd: Date;
    private _todayString: string = "today";
    private _selected: string = "today";
    private _yesterday: string = "yesterday";
    private _thisWeek: string = "this_week";
    private _lastSevenDays: string = "last_seven_days";
    private _lastThirtyDays: string = "last_thirty_days";
    private establishmentId: string;

    constructor(private _activatedRoute: ActivatedRoute,
        private _ngZone: NgZone,
        private _translate: TranslateService,
        private _userLanguageService: UserLanguageService) {

        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');

        this._activatedRoute.params.forEach((params: Params) => {
            this.establishmentId = params['param1'];
        });

        this._selected = this._todayString;
        this._dataSelect = [
            { value: this._todayString, viewValue: 'CHART_DETAIL.TODAY', selected: true },
            { value: this._yesterday, viewValue: 'CHART_DETAIL.YESTERDAY' },
            { value: this._thisWeek, viewValue: 'CHART_DETAIL.THIS_WEEK' },
            { value: this._lastSevenDays, viewValue: 'CHART_DETAIL.SEVEN_DAYS' },
            { value: this._lastThirtyDays, viewValue: 'CHART_DETAIL.THIRTY_DAYS' }
        ];

        this._dateIni = new Date();
        this._dateEnd = new Date();
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
                    this.setDoughnutBarChart();
                });
            });
        });

        this._ordersSubscription = MeteorObservable.subscribe('getOrdersByEstablishmentId', this.establishmentId, ['ORDER_STATUS.RECEIVED']).subscribe(() => {
            this._ngZone.run(() => {
                let todayDate = new Date();
                this._orders = Orders.find({}).zone();
                this._orders.subscribe(() => {
                    this.setBarChartData();
                    this.setDoughnutBarChart();
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
        if (_pOption === this._todayString) {
            this._dateIni = new Date();
            this._dateEnd = new Date();
        } else if (_pOption === this._yesterday) {
            this._dateIni = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1);
            this._dateEnd = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1);
        } else if (_pOption === this._thisWeek) {
            let _lDayWeek: number = this._today.getDay();
            this._dateIni = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - _lDayWeek);
            this._dateEnd = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1);
        } else if (_pOption === this._lastSevenDays) {
            this._dateIni = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 7);
            this._dateEnd = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1);
        } else if (_pOption === this._lastThirtyDays) {
            this._dateIni = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 30);
            this._dateEnd = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1);
        }
        this.setBarChartData();
    }

    /**
     * Set Bar chart data 
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

    //public doughnutChartLabels: string[] = ['Download Sales', 'In-Store Sales'];
    //public doughnutChartData: number[] = [2, 6, 5];
    public doughnutChartLabels: string[] = [];
    public doughnutChartData: number[] = [0]
    public doughnutChartType: string = 'doughnut';

    setDoughnutBarChart() {
        let _lCurrentMax: any = { index: 0, value: 0 };
        let _lCurrentMin: any = { index: 0, value: 0 };
        let _lDoughnutChartLabels : string[] = [];
        let _lDoughnutChartData : number[] = [];

        Items.collection.find().fetch().forEach((item) => {
            let _lAggregate: number = 0;
            Orders.collection.find({
                'items.itemId': item._id,
                'creation_date': {
                    $gte: new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1)
                }
            }).fetch().forEach((order) => {
                order.items.forEach((itemObject) => {
                    if (itemObject.itemId === item._id) {
                        _lAggregate = _lAggregate + itemObject.quantity;
                    }
                });
            });
            _lDoughnutChartLabels.push(item.name);
            _lDoughnutChartData.push(_lAggregate);
        });

        
        let _lTemp: number = Math.max.apply(null, _lDoughnutChartData);
        for (let i = 0; i < _lDoughnutChartData.length; i++) {
            if (_lDoughnutChartData[i] > 0) {
                let afterTemp: number = _lTemp;
                _lTemp = _lDoughnutChartData[i];
                if (_lTemp < afterTemp) {
                    _lCurrentMin = { index: i, label: _lDoughnutChartLabels[i], value: _lDoughnutChartData[i] };
                }
            }
            if (_lDoughnutChartData[i] > _lCurrentMax.value) {
                _lCurrentMax = { index: i, label: _lDoughnutChartLabels[i], value: _lDoughnutChartData[i] };
            }
        }

        //this.doughnutChartLabels.pop();
        this.doughnutChartLabels = ['_lCurrentMax.label', '_lCurrentMin.label'];
        this.doughnutChartData = [_lCurrentMax.value, _lCurrentMin.value];

        console.log(this.doughnutChartLabels);
        console.log(this.doughnutChartData);
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