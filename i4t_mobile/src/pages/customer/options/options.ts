import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { NavController } from 'ionic-angular';
import { WaiterCallPage } from '../waiter-call/waiter-call';
import { ChangeTablePage } from '../options/table-change/table-change';
import { EstablishmentExitPage } from './establishment-exit/establishment-exit';

@Component({
    selector: 'page-options',
    templateUrl: 'options.html'
})
export class OptionsPage implements OnInit, OnDestroy {

    /**
     * OptionsPage constructor
     */
    constructor(public _navCtrl: NavController) {

    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {

    }

    /**
     * Go to waiter call page
     */
    goToWaiterCall() {
        this._navCtrl.push(WaiterCallPage);
    }

    /**
     * Go to change table page
     */
    goToChangeTable() {
        this._navCtrl.push(ChangeTablePage);
    }

    /**
     * Go to establishment exit page
     */
    goToEstablishmentExit() {
        this._navCtrl.push(EstablishmentExitPage);
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {

    }
}