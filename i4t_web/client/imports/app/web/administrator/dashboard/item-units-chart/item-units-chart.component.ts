import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Meteor } from 'meteor/meteor';
import { Chart } from 'angular-highcharts';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { Item } from '../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../both/collections/menu/item.collection';
import { Order } from '../../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../../both/collections/establishment/order.collection';

@Component({
    selector: 'item-units-chart',
    templateUrl: './item-units-chart.component.html',
    styleUrls: ['./item-units-chart.component.scss']
})

export class ItemUnitsChartComponent implements OnInit, OnDestroy {

    private _establishmentId: string = null;
    private itemUnitsChart;
    private _establishmentsSubscription: Subscription;
    private _itemsSubscription: Subscription;
    private _ordersSubscription: Subscription;
    private _items: Observable<Item[]>;
    private _orders: Observable<Order[]>;
    private _establishment: Establishment = null;

    private xAxisArray: string[] = [];
    private todaySeriesArray: number[] = [];
    private yesterdaySeriesArray: number[] = [];
    private lastSevenDaysArray: number[] = [];
    private lastThirtyDaysArray: number[] = [];
    private _today: Date = new Date();
    private _todayDateIni: Date;
    private _todayDateEnd: Date;
    private _yesterdayDateIni: Date;
    private _yesterdayDateEnd: Date;
    private _lastSevenDaysDateIni: Date;
    private _lastSevenDaysDateEnd: Date;
    private _lastThirtyDaysDateIni: Date;
    private _lastThirtyDaysDateEnd: Date;

    private dateRangeLbl: string;

    /**
   * DashboardComponent Constructor
   * @param {TranslateService} _translate 
   * @param {NgZone} _ngZone 
   * @param {Router} _router
   * @param {UserLanguageService} _userLanguageService
   */
    constructor(private _activatedRoute: ActivatedRoute,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');

        this._activatedRoute.params.forEach((params: Params) => {
            this._establishmentId = params['param1'];
        });

        this._todayDateIni = new Date();
        this._todayDateEnd = new Date();

        this._yesterdayDateIni = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1);
        this._yesterdayDateEnd = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1);

        this._lastSevenDaysDateIni = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 7);
        this._lastSevenDaysDateEnd = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1);

        this._lastThirtyDaysDateIni = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 30);
        this._lastThirtyDaysDateEnd = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1);
    }

    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentsSubscription = MeteorObservable.subscribe('getEstablishmentById', this._establishmentId).subscribe(() => {
            this._ngZone.run(() => {
                this._establishment = Establishments.findOne({ _id: this._establishmentId });
            });
        });

        this._itemsSubscription = MeteorObservable.subscribe('itemsByEstablishmentSortedByName', this._establishmentId).subscribe();

        this._ordersSubscription = MeteorObservable.subscribe('getOrdersByEstablishmentId', this._establishmentId, ['ORDER_STATUS.RECEIVED']).subscribe(() => {
            this._ngZone.run(() => {
                let todayDate = new Date();
                this._orders = Orders.find({}).zone();

                this._orders.subscribe(() => {
                    this.setBarChartData();
                });
            });
        });
    }

    /**
     * Set the chart data according to the initial conditions
     */
    setBarChartData() {

        this.dateRangeLbl = this.itemNameTraduction('ITEM_UNIT_CHART.TODAY');
        let chartTitle: string = this.itemNameTraduction('ITEM_UNIT_CHART.CHART_TITLE');
        let chartSubtitle: string = this.itemNameTraduction('ITEM_UNIT_CHART.CHART_SUBTITLE');
        let unitsLbl: string = this.itemNameTraduction('ITEM_UNIT_CHART.UNITS_LBL');
        let itemsLbl: string = this.itemNameTraduction('ITEM_UNIT_CHART.ITEMS_LBL');
        let todayLbl: string = this.itemNameTraduction('ITEM_UNIT_CHART.TODAY');
        let yesterdayLbl: string = this.itemNameTraduction('ITEM_UNIT_CHART.YESTERDAY')
        let lastSevenDaysLbl: string = this.itemNameTraduction('ITEM_UNIT_CHART.SEVEN_DAYS');
        let lastThirtyDaysLbl: string = this.itemNameTraduction('ITEM_UNIT_CHART.THIRTY_DAYS');

        this.xAxisArray = [];
        this.todaySeriesArray = [];
        this.yesterdaySeriesArray = [];
        this.lastSevenDaysArray = [];
        this.lastThirtyDaysArray = [];

        let aux = 0;
        Items.collection.find({}).fetch().forEach((item) => {
            let _todayAggregate: number = 0;
            let _yesterdayAggregate: number = 0;
            let _lastSevenDaysAggregate: number = 0;
            let _lastThirtyDaysAggregate: number = 0;

            this.xAxisArray.push(item.name);

            //Orders today
            Orders.collection.find({
                'items.itemId': item._id,
                'creation_date': {
                    $gte: new Date(this._todayDateIni.getFullYear(), this._todayDateIni.getMonth(), this._todayDateIni.getDate()),
                    $lte: new Date(this._todayDateEnd.getFullYear(), this._todayDateEnd.getMonth(), this._todayDateEnd.getDate(), 23, 59, 59)
                }
            }).fetch().forEach((order) => {
                order.items.forEach((orderItem) => {
                    if (orderItem.itemId === item._id) {
                        _todayAggregate = _todayAggregate + orderItem.quantity;
                    }
                })
            });
            this.todaySeriesArray.push(_todayAggregate);

            //Orders yesterday
            Orders.collection.find({
                'items.itemId': item._id,
                'creation_date': {
                    $gte: new Date(this._yesterdayDateIni.getFullYear(), this._yesterdayDateIni.getMonth(), this._yesterdayDateIni.getDate()),
                    $lte: new Date(this._yesterdayDateEnd.getFullYear(), this._yesterdayDateEnd.getMonth(), this._yesterdayDateEnd.getDate(), 23, 59, 59)
                }
            }).fetch().forEach((order) => {
                order.items.forEach((orderItem) => {
                    if (orderItem.itemId === item._id) {
                        _yesterdayAggregate = _yesterdayAggregate + orderItem.quantity;
                    }
                })
            });
            this.yesterdaySeriesArray.push(_yesterdayAggregate);

            //Orders last seven days
            Orders.collection.find({
                'items.itemId': item._id,
                'creation_date': {
                    $gte: new Date(this._lastSevenDaysDateIni.getFullYear(), this._lastSevenDaysDateIni.getMonth(), this._lastSevenDaysDateIni.getDate()),
                    $lte: new Date(this._lastSevenDaysDateEnd.getFullYear(), this._lastSevenDaysDateEnd.getMonth(), this._lastSevenDaysDateEnd.getDate(), 23, 59, 59)
                }
            }).fetch().forEach((order) => {
                order.items.forEach((orderItem) => {
                    if (orderItem.itemId === item._id) {
                        _lastSevenDaysAggregate = _lastSevenDaysAggregate + orderItem.quantity;
                    }
                })
            });
            this.lastSevenDaysArray.push(_lastSevenDaysAggregate);

            //Orders last thirty days
            Orders.collection.find({
                'items.itemId': item._id,
                'creation_date': {
                    $gte: new Date(this._lastThirtyDaysDateIni.getFullYear(), this._lastThirtyDaysDateIni.getMonth(), this._lastThirtyDaysDateIni.getDate()),
                    $lte: new Date(this._lastThirtyDaysDateEnd.getFullYear(), this._lastThirtyDaysDateEnd.getMonth(), this._lastThirtyDaysDateEnd.getDate(), 23, 59, 59)
                }
            }).fetch().forEach((order) => {
                order.items.forEach((orderItem) => {
                    if (orderItem.itemId === item._id) {
                        _lastThirtyDaysAggregate = _lastThirtyDaysAggregate + orderItem.quantity;
                    }
                })
            });
            this.lastThirtyDaysArray.push(_lastThirtyDaysAggregate);
        });

        this.itemUnitsChart = new Chart({
            chart: {
                type: 'bar',
                height: "100%"
            },
            title: {
                text: chartTitle,
            },
            subtitle: {
                text: chartSubtitle
            },
            xAxis: {
                categories: this.xAxisArray,
                title: {
                    text: itemsLbl
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: unitsLbl,
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            tooltip: {
                valueSuffix: ' ' + unitsLbl
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            legend: {
                align: 'right',
                verticalAlign: 'top',
                layout: 'vertical',
                x: 0,
                y: 100
            },
            credits: {
                enabled: false
            },
            series: [{
                name: todayLbl,
                data: this.todaySeriesArray,
                color: '#2196F3'
            }, {
                name: yesterdayLbl,
                data: this.yesterdaySeriesArray,
                color: '#8BC34A'
            }, {
                name: lastSevenDaysLbl,
                data: this.lastSevenDaysArray,
                color: '#FF9800'
            }, {
                name: lastThirtyDaysLbl,
                data: this.lastThirtyDaysArray,
                color: '#9C27B0'
            }
            ]
        });
    }


    /**
     * Return traduction
     * @param {string} itemName 
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
   * Remove all subscriptions
   */
    removeSubscriptions(): void {
        if (this._itemsSubscription) { this._itemsSubscription.unsubscribe(); }
        if (this._ordersSubscription) { this._ordersSubscription.unsubscribe(); }
        if (this._establishmentsSubscription) { this._establishmentsSubscription.unsubscribe(); }
    }

    /**
    * NgOnDestroy implementation
    */
    ngOnDestroy() {
        this.removeSubscriptions();
    }

}