import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Meteor } from 'meteor/meteor';
import { Chart } from 'angular-highcharts';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { OrderHistory } from '../../../../../../../both/models/establishment/order-history.model';
import { OrderHistories } from '../../../../../../../both/collections/establishment/order-history.collection';

@Component({
    selector: 'item-units-chart',
    templateUrl: './item-units-chart.component.html',
    styleUrls: ['./item-units-chart.component.scss']
})

export class ItemUnitsChartComponent implements OnInit, OnDestroy {

    private _establishmentId: string = null;
    private itemUnitsChart;
    private _establishmentsSubscription: Subscription;
    private _establishment: Establishment = null;

    private _orderHistorySubscription: Subscription;
    private _ordersHistory: Observable<OrderHistory[]>;

    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private xAxisArray: string[] = [];
    private todaySeriesArray: number[] = [];
    private _today: Date = new Date();
    private _todayDateIni: Date;
    private _todayDateEnd: Date;

    private dateRangeLbl: string;
    private itemNameArray: string[];

    /**
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
    }

    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentsSubscription = MeteorObservable.subscribe('getEstablishmentById', this._establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishment = Establishments.findOne({ _id: this._establishmentId });
            });
        });

        this._orderHistorySubscription = MeteorObservable.subscribe('getOrderHistoryByEstablishment', this._establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._ordersHistory = OrderHistories.find({ establishment_id: this._establishmentId }).zone();

                this._ordersHistory.subscribe(() => {
                    this.setBarChartData();
                });
            });
        });
    }

    /**
     * Set the chart data according to the initial conditions
     */
    setBarChartData() {
        let chartTitle: string = this.itemNameTraduction('ITEM_UNIT_CHART.CHART_TITLE');
        let chartSubtitle: string = this.itemNameTraduction('ITEM_UNIT_CHART.CHART_SUBTITLE');
        let unitsLbl: string = this.itemNameTraduction('ITEM_UNIT_CHART.UNITS_LBL');
        let itemsLbl: string = this.itemNameTraduction('ITEM_UNIT_CHART.ITEMS_LBL');
        let todayLbl: string = this.itemNameTraduction('ITEM_UNIT_CHART.TODAY');

        this.xAxisArray = [];
        this.todaySeriesArray = [];
        this.itemNameArray = [];

        OrderHistories.collection.find({
            'creation_date': {
                $gte: new Date(this._todayDateIni.getFullYear(), this._todayDateIni.getMonth(), this._todayDateIni.getDate()),
                $lte: new Date(this._todayDateEnd.getFullYear(), this._todayDateEnd.getMonth(), this._todayDateEnd.getDate(), 23, 59, 59)
            }
        }).fetch().forEach((orderHistory) => {
            orderHistory.items.forEach((item) => {
                let indexofvar = this.itemNameArray.indexOf(item.item_name);
                if (indexofvar < 0) {
                    this.itemNameArray.push(item.item_name);
                }
            });
        });
        this.itemNameArray.sort();
        this.xAxisArray = this.itemNameArray;

        this.itemNameArray.forEach((itemName) => {
            let _todayAggregate: number = 0;

            //Orders today
            OrderHistories.collection.find({
                'items.item_name': itemName,
                'creation_date': {
                    $gte: new Date(this._todayDateIni.getFullYear(), this._todayDateIni.getMonth(), this._todayDateIni.getDate()),
                    $lte: new Date(this._todayDateEnd.getFullYear(), this._todayDateEnd.getMonth(), this._todayDateEnd.getDate(), 23, 59, 59)
                }
            }).fetch().forEach((orderHistory) => {
                orderHistory.items.forEach((orderHistoryItem) => {
                    if (orderHistoryItem.item_name === itemName) {
                        _todayAggregate = _todayAggregate + orderHistoryItem.quantity;
                    }
                });
            });
            this.todaySeriesArray.push(_todayAggregate);
        });

        this.itemUnitsChart = new Chart({
            chart: {
                type: 'bar'
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
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
    * NgOnDestroy implementation
    */
    ngOnDestroy() {
        this.removeSubscriptions();
    }

}