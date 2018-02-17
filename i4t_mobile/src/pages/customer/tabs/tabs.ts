import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrdersPage } from '../orders/orders';
import { OptionsPage } from '../options/options';

@Component({
    templateUrl: 'tabs.html'
})
export class TabsPage implements OnInit, OnDestroy {

    tabOrders: any = OrdersPage;
    tabOptions: any = OptionsPage;

    /**
     * TabsPage constructor
     */
    constructor() {
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
    }
}