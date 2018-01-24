import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
//import { Router, ActivatedRoute, Params } from '@angular/router';
//import { MeteorObservable, MongoObservable } from 'meteor-rxjs';
//import { TranslateService } from '@ngx-translate/core';
//import { Observable, Subscription } from 'rxjs';
//import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
//import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
//import { UserLanguageService } from '../../../../services/general/user-language.service';
//import { Item } from '../../../../../../../../both/models/menu/item.model';
//import { Items } from '../../../../../../../../both/collections/menu/item.collection';
//import { Order } from '../../../../../../../../both/models/establishment/order.model';
//import { Orders } from '../../../../../../../../both/collections/establishment/order.collection';
//import { take } from 'rxjs/operators/take';

@Component({
    selector: 'chart-detail',
    templateUrl: './chart-detail.component.html',
    styleUrls: ['./chart-detail.component.scss']
})
export class ChartDetailComponent implements OnInit, OnDestroy {





    /**
     * NgOnInit Implementation
     */
    ngOnInit() {

    }


    /**
     * NgOnDestroy implementation
     */
    ngOnDestroy() {
    }

    single: any[];
    multi: any[];

    view: any[] = [700, 400];

    // options
    showXAxis = true;
    showYAxis = true;
    gradient = false;
    showLegend = true;
    showXAxisLabel = true;
    xAxisLabel = 'Country';
    showYAxisLabel = true;
    yAxisLabel = 'Population';

    colorScheme = {
        domain: ['#EF5350', '#AB47BC', '#7E57C2', '#42A5F5']
    };

    constructor() {
        Object.assign(this, { single, multi })
    }

    onSelect(event) {
        console.log(event);
    }

}

export var single = [
    {
        "name": "Germany",
        "value": 8940000
    },
    {
        "name": "USA",
        "value": 5000000
    },
    {
        "name": "France",
        "value": 7200000
    }
];

export var multi = [
    {
        "name": "Germany",
        "series": [
            {
                "name": "2010",
                "value": 7300000
            },
            {
                "name": "2011",
                "value": 8940000
            }
        ]
    },

    {
        "name": "USA",
        "series": [
            {
                "name": "2010",
                "value": 7870000
            },
            {
                "name": "2011",
                "value": 8270000
            }
        ]
    },

    {
        "name": "France",
        "series": [
            {
                "name": "2010",
                "value": 5000002
            },
            {
                "name": "2011",
                "value": 5800000
            }
        ]
    }
];