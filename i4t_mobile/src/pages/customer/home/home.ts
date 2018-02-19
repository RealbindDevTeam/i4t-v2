import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams, MenuController } from 'ionic-angular';
import { OrdersPage } from '../orders/orders';

@Component({
    templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy {

    /**
     * HomePage constructor
     */
    constructor(public _navCtrl: NavController, _menuCtrl: MenuController) {
        _menuCtrl.enable(true);
    }

    /**
     * Function to go to establishments 
     */
    goToEstablishmentList() {

    }

    /**
     * Go to ordering in a establishment
     */
    goToOrderInEstablishment() {
        this._navCtrl.push(OrdersPage);
    }

    /**
     * Function to go my acumulated points
     */
    goToMyAccumulatedPoints() {

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