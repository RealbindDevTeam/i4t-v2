import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams, PopoverController } from 'ionic-angular';
import { SegmentsPage } from '../segments/segments';
import { PointsPage } from '../points/points/points';
import { PopoverOptionsPage } from './popover-options/popover-options';
import { EstablishmentListPage } from "../establishment-list/establishment-list";

@Component({
    templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy {


    /**
     * HomePage constructor
     */
    constructor(public _navCtrl: NavController, public popoverCtrl: PopoverController) {
    }

    /**
    * ngOnInit implementation
    */
    ngOnInit() {
    }

    presentPopover(myEvent) {
        let popover = this.popoverCtrl.create(PopoverOptionsPage);
        popover.present({
            ev: myEvent
        });
    }

    /**
     * Function to go to establishments 
     */
    goToEstablishmentList() {
        this._navCtrl.push(EstablishmentListPage);
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
        this._navCtrl.push(PointsPage);
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
    }
}