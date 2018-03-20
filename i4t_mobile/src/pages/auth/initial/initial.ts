import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { NavController, AlertController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { SignupComponent } from '../signup/signup';
import { SigninComponent } from '../signin/signin';
import { Network } from '@ionic-native/network';
import { Meteor } from 'meteor/meteor'
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'page-initial',
    templateUrl: 'initial.html'
})

export class InitialComponent {

    userLang: string;
    private disconnectSubscription: Subscription;

    constructor(public zone: NgZone, public navCtrl: NavController, public translate: TranslateService,
        private _network: Network, private alertCtrl: AlertController, public platform: Platform) {

        this.userLang = navigator.language.split('-')[0];
        translate.setDefaultLang('en');
        translate.use(this.userLang);
    }

    ngOnInit() {
    }

    /** 
     * This function verify the conditions on page did enter for internet and server connection
    */
    ionViewDidEnter() {
        this.isConnected();

        this.disconnectSubscription = this._network.onDisconnect().subscribe(data => {
            this.presentAlert();
        }, error => console.error(error));
    }

    /** 
     * This function verify with network plugin if device has internet connection
    */
    isConnected() {
        if (this.platform.is('cordova')) {
            let conntype = this._network.type;
            let validateConn = conntype && conntype !== 'unknown' && conntype !== 'none';
            if (!validateConn) {
                this.presentAlert();
            }
        }
    }

    /**
     * Present the alert for advice to internet
    */
    presentAlert() {
        let alert = this.alertCtrl.create({
            title: this.itemNameTraduction('MOBILE.CONNECTION_ALERT.TITLE'),
            subTitle: this.itemNameTraduction('MOBILE.CONNECTION_ALERT.SUBTITLE'),
            enableBackdropDismiss: false,
            buttons: [
                {
                    text: this.itemNameTraduction('MOBILE.CONNECTION_ALERT.BTN'),
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

    goToSignUp() {
        this.navCtrl.push(SignupComponent);
    }

    goToSignIn() {
        this.navCtrl.push(SigninComponent);
    }

    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
    }

    ngOnDestroy() {
    }
}
