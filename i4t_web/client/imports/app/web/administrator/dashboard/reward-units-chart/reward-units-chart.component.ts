import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Meteor } from 'meteor/meteor';
import { Chart } from 'angular-highcharts';
import { Item } from '../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../both/collections/menu/item.collection';
import { Reward } from '../../../../../../../both/models/establishment/reward.model';
import { Rewards } from '../../../../../../../both/collections/establishment/reward.collection';
import { Order } from '../../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../../both/collections/establishment/order.collection';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';


@Component({
    selector: 'item-units-chart',
    templateUrl: './reward-units-chart.component.html',
    styleUrls: ['./reward-units-chart.component.scss']
})

export class RewardUnitsChartComponent implements OnInit, OnDestroy {

    private _establishmentId: string = null;
    private rewardUnitsChart;
    private _rewardsSubscription: Subscription;
    private _itemsSubscription: Subscription;
    private _ordersSubscription: Subscription;
    private _establishmentsSubscription: Subscription;

    private _rewards: Observable<Reward[]>;
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
        this._establishmentsSubscription = MeteorObservable.subscribe('getEstablishmentById', this._establishmentId).subscribe(() => {
            this._ngZone.run(() => {
                this._establishment = Establishments.findOne({ _id: this._establishmentId });
            });
        });

        this._rewardsSubscription = MeteorObservable.subscribe('getRewardsToItems', this._establishmentId).subscribe(() => {
            this._ngZone.run(() => {
                this._rewards = Rewards.find({});
            })
        });

        this._itemsSubscription = MeteorObservable.subscribe('itemsByEstablishmentSortedByName', this._establishmentId).subscribe();

        this._ordersSubscription = MeteorObservable.subscribe('getOrdersByEstablishmentId', this._establishmentId, ['ORDER_STATUS.RECEIVED']).subscribe(() => {
            this._ngZone.run(() => {
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
        let chartTitle: string = this.itemNameTraduction('REWARD_UNIT_CHART.CHART_TITLE');
        let chartSubtitle: string = this.itemNameTraduction('REWARD_UNIT_CHART.CHART_SUBTITLE');
        let unitsLbl: string = this.itemNameTraduction('REWARD_UNIT_CHART.UNITS_LBL');
        let itemsLbl: string = this.itemNameTraduction('REWARD_UNIT_CHART.REWARDS_LBL');
        let todayLbl: string = this.itemNameTraduction('REWARD_UNIT_CHART.TODAY');
        let yesterdayLbl: string = this.itemNameTraduction('REWARD_UNIT_CHART.YESTERDAY')
        let lastSevenDaysLbl: string = this.itemNameTraduction('REWARD_UNIT_CHART.SEVEN_DAYS');
        let lastThirtyDaysLbl: string = this.itemNameTraduction('REWARD_UNIT_CHART.THIRTY_DAYS');

        this.xAxisArray = [];
        this.todaySeriesArray = [];
        this.yesterdaySeriesArray = [];
        this.lastSevenDaysArray = [];
        this.lastThirtyDaysArray = [];

        Rewards.collection.find({}).fetch().forEach((reward) => {
            let _item: Item;
            let _todayAggregate: number = 0;
            let _yesterdayAggregate: number = 0;
            let _lastSevenDaysAggregate: number = 0;
            let _lastThirtyDaysAggregate: number = 0;

            console.log(reward.item_id);
            console.log(this._establishmentId);

            Items.collection.find({ 'establishments.establishment_id': { $in: [this._establishmentId] }, _id: reward.item_id }).fetch().forEach((item) => {
                this.xAxisArray.push(item.name);

                Orders.collection.find({
                    'items.itemId': item._id,
                    'creation_date': {
                        $gte: new Date(this._todayDateIni.getFullYear(), this._todayDateIni.getMonth(), this._todayDateIni.getDate()),
                        $lte: new Date(this._todayDateEnd.getFullYear(), this._todayDateEnd.getMonth(), this._todayDateEnd.getDate(), 23, 59, 59)
                    }
                }).fetch().forEach(element => {

                });

            });
        });

        this.rewardUnitsChart = new Chart({
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
                data: [10, 20],
                color: '#2196F3'
            }
            ]
        });
    }

    removeSubscriptions(): void {
        if (this._itemsSubscription) { this._itemsSubscription.unsubscribe(); }
        if (this._ordersSubscription) { this._ordersSubscription.unsubscribe(); }
        if (this._establishmentsSubscription) { this._establishmentsSubscription.unsubscribe(); }
        if (this._rewardsSubscription) { this._rewardsSubscription.unsubscribe(); }
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
    * NgOnDestroy implementation
    */
    ngOnDestroy() {
        this.removeSubscriptions();
    }

}