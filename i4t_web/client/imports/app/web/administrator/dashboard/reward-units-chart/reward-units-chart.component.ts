import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Meteor } from 'meteor/meteor';
import { Chart } from 'angular-highcharts';

@Component({
    selector: 'item-units-chart',
    templateUrl: './reward-units-chart.component.html',
    styleUrls: ['./reward-units-chart.component.scss']
})

export class RewardUnitsChartComponent implements OnInit, OnDestroy {

}