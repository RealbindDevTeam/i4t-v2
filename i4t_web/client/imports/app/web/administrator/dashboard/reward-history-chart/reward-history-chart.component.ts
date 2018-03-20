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
    selector: 'reward-history-chart',
    templateUrl: './reward-history-chart.component.html',
    styleUrls: ['./reward-history-chart.component.scss']
})

export class RewardHistoryChartComponent implements OnInit, OnDestroy {

    private _establishmentId: string = null;
    private rewardHistoryChart;
    private _establishmentsSubscription: Subscription;
    private _establishment: Establishment = null;

    private _orderHistoriesSubscription: Subscription;
    private _ordersHistory: Observable<OrderHistory[]>;

    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private xAxisArray: string[] = [];
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
    private rewardNameArray: string[];

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

        this._yesterdayDateIni = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1);
        this._yesterdayDateEnd = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1);

        this._lastSevenDaysDateIni = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 7);
        this._lastSevenDaysDateEnd = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1);

        this._lastThirtyDaysDateIni = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 30);
        this._lastThirtyDaysDateEnd = new Date(this._today.getFullYear(), this._today.getMonth(), this._today.getDate() - 1);
    }

    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentsSubscription = MeteorObservable.subscribe('getEstablishmentById', this._establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishment = Establishments.findOne({ _id: this._establishmentId });
            });
        });

        this._orderHistoriesSubscription = MeteorObservable.subscribe('getOrderHistoryByEstablishment', this._establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._ordersHistory = OrderHistories.find({}).zone();
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
        let chartTitle: string = this.itemNameTraduction('REWARD_HISTORY_CHART.CHART_TITLE');
        let chartSubtitle: string = this.itemNameTraduction('REWARD_HISTORY_CHART.CHART_SUBTITLE');
        let unitsLbl: string = this.itemNameTraduction('REWARD_HISTORY_CHART.UNITS_LBL');
        let itemsLbl: string = this.itemNameTraduction('REWARD_HISTORY_CHART.REWARDS_LBL');
        let yesterdayLbl: string = this.itemNameTraduction('REWARD_HISTORY_CHART.YESTERDAY')
        let lastSevenDaysLbl: string = this.itemNameTraduction('REWARD_HISTORY_CHART.SEVEN_DAYS');
        let lastThirtyDaysLbl: string = this.itemNameTraduction('REWARD_HISTORY_CHART.THIRTY_DAYS');

        this.xAxisArray = [];
        this.yesterdaySeriesArray = [];
        this.lastSevenDaysArray = [];
        this.lastThirtyDaysArray = [];
        this.rewardNameArray = [];

        OrderHistories.collection.find({}).fetch().forEach((orderHistory) => {
            orderHistory.items.forEach((item) => {
                if (item.is_reward) {
                    let indexofvar = this.rewardNameArray.indexOf(item.item_name);
                    if (indexofvar < 0) {
                        this.rewardNameArray.push(item.item_name);
                    }
                }
            });
        });
        this.rewardNameArray.sort();
        this.xAxisArray = this.rewardNameArray;

        this.rewardNameArray.forEach((itemName) => {
            let _yesterdayAggregate: number = 0;
            let _lastSevenDaysAggregate: number = 0;
            let _lastThirtyDaysAggregate: number = 0;

            //Orders yesterday
            OrderHistories.collection.find({
                'items.item_name': itemName,
                'creation_date': {
                    $gte: new Date(this._yesterdayDateIni.getFullYear(), this._yesterdayDateIni.getMonth(), this._yesterdayDateIni.getDate()),
                    $lte: new Date(this._yesterdayDateEnd.getFullYear(), this._yesterdayDateEnd.getMonth(), this._yesterdayDateEnd.getDate(), 23, 59, 59)
                }
            }).fetch().forEach((orderHistory) => {
                orderHistory.items.forEach((orderHistoryItem) => {
                    if ((orderHistoryItem.item_name === itemName) && orderHistoryItem.is_reward) {
                        _yesterdayAggregate = _yesterdayAggregate + orderHistoryItem.quantity;
                    }
                });
            });
            this.yesterdaySeriesArray.push(_yesterdayAggregate);

            //Orders last seven days
            OrderHistories.collection.find({
                'items.item_name': itemName,
                'creation_date': {
                    $gte: new Date(this._lastSevenDaysDateIni.getFullYear(), this._lastSevenDaysDateIni.getMonth(), this._lastSevenDaysDateIni.getDate()),
                    $lte: new Date(this._lastSevenDaysDateEnd.getFullYear(), this._lastSevenDaysDateEnd.getMonth(), this._lastSevenDaysDateEnd.getDate(), 23, 59, 59)
                }
            }).fetch().forEach((orderHistory) => {
                orderHistory.items.forEach((orderHistoryItem) => {
                    if ((orderHistoryItem.item_name === itemName) && orderHistoryItem.is_reward) {
                        _lastSevenDaysAggregate = _lastSevenDaysAggregate + orderHistoryItem.quantity;
                    }
                });
            });
            this.lastSevenDaysArray.push(_lastSevenDaysAggregate);

            //Orders last thirty days
            OrderHistories.collection.find({
                'items.item_name': itemName,
                'creation_date': {
                    $gte: new Date(this._lastThirtyDaysDateIni.getFullYear(), this._lastThirtyDaysDateIni.getMonth(), this._lastThirtyDaysDateIni.getDate()),
                    $lte: new Date(this._lastThirtyDaysDateEnd.getFullYear(), this._lastThirtyDaysDateEnd.getMonth(), this._lastThirtyDaysDateEnd.getDate(), 23, 59, 59)
                }
            }).fetch().forEach((orderHistory) => {
                orderHistory.items.forEach((orderHistoryItem) => {
                    if ((orderHistoryItem.item_name === itemName) && orderHistoryItem.is_reward) {
                        _lastThirtyDaysAggregate = _lastThirtyDaysAggregate + orderHistoryItem.quantity;
                    }
                });
            });
            this.lastThirtyDaysArray.push(_lastThirtyDaysAggregate);
        });

        this.rewardHistoryChart = new Chart({
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