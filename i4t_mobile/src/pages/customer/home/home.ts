import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams, PopoverController, AlertController, Platform } from 'ionic-angular';
import { SegmentsPage } from '../segments/segments';
import { PointsPage } from '../points/points/points';
import { PopoverOptionsPage } from './popover-options/popover-options';
import { EstablishmentListPage } from "../establishment-list/establishment-list";
import { Network } from '@ionic-native/network';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/Subscription';

@Component({
    templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy {

    private disconnectSubscription: Subscription;

    /**
     * HomePage constructor
     */
    constructor(public _navCtrl: NavController, public popoverCtrl: PopoverController, public _alertCtrl: AlertController,
        public _platform: Platform, private _network: Network, public translate: TranslateService) {
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
     * This function verify the conditions on page did enter for internet and server connection
    */
    ionViewDidEnter() {
        this.isConnected();
        this.disconnectSubscription = this._network.onDisconnect().subscribe(data => {
            let title = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.TITLE');
            let subtitle = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.SUBTITLE');
            let btn = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.BTN');
            this.presentAlert(title, subtitle, btn);
        }, error => console.error(error));
    }

    /** 
     * This function verify with network plugin if device has internet connection
    */
    isConnected() {
        if (this._platform.is('cordova')) {
            let conntype = this._network.type;
            let validateConn = conntype && conntype !== 'unknown' && conntype !== 'none';
            if (!validateConn) {
                let title = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.TITLE');
                let subtitle = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.SUBTITLE');
                let btn = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.BTN');
                this.presentAlert(title, subtitle, btn);
            } else {
                if (!Meteor.status().connected) {
                    let title2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.TITLE');
                    let subtitle2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.SUBTITLE');
                    let btn2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.BTN');
                    this.presentAlert(title2, subtitle2, btn2);
                }
            }
        }
    }

    /**
     * Present the alert for advice to internet
    */
    presentAlert(_pTitle: string, _pSubtitle: string, _pBtn: string) {
        let alert = this._alertCtrl.create({
            title: _pTitle,
            subTitle: _pSubtitle,
            enableBackdropDismiss: false,
            buttons: [
                {
                    text: _pBtn,
                    handler: () => {
                        this.isConnected();
                    }
                }
            ]
        });
        alert.present();
    }

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this.translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }
    
    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
    }
}