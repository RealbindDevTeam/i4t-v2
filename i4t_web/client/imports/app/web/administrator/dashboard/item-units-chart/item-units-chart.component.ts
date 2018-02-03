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

export class ItemUnitsComponent implements OnInit, OnDestroy {

    private _establishmentId: string = null;
    private itemUnitsChart;
    private _establishmentsSubscription: Subscription;
    private _itemsSubscription: Subscription;
    private _ordersSubscription: Subscription;
    private _items: Observable<Item[]>;
    private _orders: Observable<Order[]>;
    private _establishment: Establishment = null;

    private xAxisArray: string[] = [];
    private seriesArray: number[] = [];
    private _dateIni: Date;
    private _dateEnd: Date;

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

        this._dateIni = new Date();
        this._dateEnd = new Date();
    }

    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentsSubscription = MeteorObservable.subscribe('getEstablishmentById', this._establishmentId).subscribe(() => {
            this._ngZone.run(() => {
                this._establishment = Establishments.findOne({ _id: this._establishmentId });
            });
        });

        this._itemsSubscription = MeteorObservable.subscribe('itemsByEstablishment', this._establishmentId).subscribe();

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
        let chartTitle: string = this.itemNameTraduction('ITEM_UNIT_CHART.ITEMS_ORDERED');
        let unitsLbl: string = this.itemNameTraduction('ITEM_UNIT_CHART.UNITS_LBL');
        let itemsLbl: string = this.itemNameTraduction('ITEM_UNIT_CHART.ITEMS_LBL');
        let todayLbl: string = this.itemNameTraduction('ITEM_UNIT_CHART.TODAY');

        this.xAxisArray = [];
        this.seriesArray = [];
        let aux = 0;
        Items.collection.find().fetch().forEach((item) => {
            let _lAggregate: number = 0;
            this.xAxisArray.push(item.name);
            Orders.collection.find({
                'items.itemId': item._id,
                'creation_date': {
                    $gte: new Date(this._dateIni.getFullYear(), this._dateIni.getMonth(), this._dateIni.getDate()),
                    $lte: new Date(this._dateEnd.getFullYear(), this._dateEnd.getMonth(), this._dateEnd.getDate(), 23, 59, 59)
                }
            }).fetch().forEach((order) => {
                order.items.forEach((orderItem) => {
                    if (orderItem.itemId === item._id) {
                        _lAggregate = _lAggregate + orderItem.quantity;
                    }
                })
            });
            this.seriesArray.push(_lAggregate);
        });

        this.itemUnitsChart = new Chart({
            chart: {
                type: 'bar'
            },
            title: {
                text: chartTitle
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
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'top',
                x: -40,
                y: 80,
                floating: true,
                borderWidth: 1,
                backgroundColor: ('#FFFFFF'),
                shadow: true
            },
            credits: {
                enabled: false
            },
            series: [{
                name: todayLbl,
                data: [107, 31, 235, 203, 99, 150]
            }]
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