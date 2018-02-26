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
import { OrderHistory } from '../../../../../../../both/models/establishment/order-history.model';
import { OrderHistories } from '../../../../../../../both/collections/establishment/order-history.collection';

@Component({
    selector: 'item-history-chart',
    templateUrl: './item-history-chart.component.html',
    styleUrls: ['./item-history-chart.component.scss']
})

export class ItemHistoryChartComponent implements OnInit, OnDestroy {

    private _establishmentId: string = null;
    private itemUnitsChart;
    private _establishmentsSubscription: Subscription;
    private _itemsSubscription: Subscription;
    private _ordersSubscription: Subscription;
    private _orderHistorySubscription: Subscription;
    private _items: Observable<Item[]>;
    private _orders: Observable<Order[]>;
    private _ordersHistory: Observable<OrderHistory[]>;
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
                this._orders = Orders.find({}).zone();

                this._orders.subscribe(() => {
                    //this.setBarChartData();
                });
            });
        });

        this._orderHistorySubscription = MeteorObservable.subscribe('getOrderHistoryByEstablishment', this._establishmentId).subscribe(() => {
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
        let chartTitle: string = this.itemNameTraduction('ITEM_HISTORY_CHART.CHART_TITLE');
        let chartSubtitle: string = this.itemNameTraduction('ITEM_HISTORY_CHART.CHART_SUBTITLE');
        let unitsLbl: string = this.itemNameTraduction('ITEM_HISTORY_CHART.UNITS_LBL');
        let itemsLbl: string = this.itemNameTraduction('ITEM_HISTORY_CHART.ITEMS_LBL');
        let todayLbl: string = this.itemNameTraduction('ITEM_HISTORY_CHART.TODAY');
        let yesterdayLbl: string = this.itemNameTraduction('ITEM_HISTORY_CHART.YESTERDAY')
        let lastSevenDaysLbl: string = this.itemNameTraduction('ITEM_HISTORY_CHART.SEVEN_DAYS');
        let lastThirtyDaysLbl: string = this.itemNameTraduction('ITEM_HISTORY_CHART.THIRTY_DAYS');

        this.xAxisArray = [];
        this.todaySeriesArray = [];
        this.yesterdaySeriesArray = [];
        this.lastSevenDaysArray = [];
        this.lastThirtyDaysArray = [];
        this.itemNameArray = [];

        OrderHistories.collection.find({}).fetch().forEach((orderHistory) => {
            orderHistory.items.forEach((item) => {
                let indexofvar = this.itemNameArray.indexOf(item.item_name);
                if (indexofvar < 0) {
                    this.itemNameArray.push(item.item_name);
                }
            });
        });
        this.itemNameArray.sort();
        this.xAxisArray = this.itemNameArray;
        console.log(this.xAxisArray);

        this.itemNameArray.forEach((itemName) => {

            let _todayAggregate: number = 0;
            let _yesterdayAggregate: number = 0;
            let _lastSevenDaysAggregate: number = 0;
            let _lastThirtyDaysAggregate: number = 0;

            OrderHistories.collection.find({
                'items.item_name': itemName,
                'creation_date': {
                    $gte: new Date(this._yesterdayDateIni.getFullYear(), this._yesterdayDateIni.getMonth(), this._yesterdayDateIni.getDate()),
                    $lte: new Date(this._yesterdayDateEnd.getFullYear(), this._yesterdayDateEnd.getMonth(), this._yesterdayDateEnd.getDate(), 23, 59, 59)
                }
            }).fetch().forEach((orderHistory) => {
                orderHistory.items.forEach((orderHistoryItem) => {
                    if (orderHistoryItem.item_name === itemName) {
                        _todayAggregate = _todayAggregate + orderHistoryItem.quantity;
                    }
                });
            });

            this.todaySeriesArray.push(_todayAggregate);

            console.log(this.todaySeriesArray);
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