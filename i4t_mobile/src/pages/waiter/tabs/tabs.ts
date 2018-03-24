import { Component, OnInit, OnDestroy } from '@angular/core';
import { CallsPage } from '../calls/calls';
import { EstablishmentMenuPage } from '../establishment-menu/establishment-menu';
import { SettingsPage } from '../../customer/options/settings/settings';
import { OrdersReceivedPage } from '../orders-received/orders-received';

@Component({
    selector: 'waiter-tabs',
    templateUrl: 'tabs.html'
})
export class TabsPage implements OnInit, OnDestroy {

    tabCalls: any = CallsPage;
    tabMenu: any = EstablishmentMenuPage;
    tabaOrdersReceived: any = OrdersReceivedPage;
    tabSettings: any = SettingsPage;

    constructor(){

    }

    ngOnInit(){

    }

    ngOnDestroy(){

    }
}