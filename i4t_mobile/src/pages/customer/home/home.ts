import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { SegmentsPage } from '../segments/segments';

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
        this._navCtrl.push(SegmentsPage);
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