import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, PopoverController, AlertController, Platform } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { Observable, Subscription, Subject } from 'rxjs';
import { Establishment } from 'i4t_web/both/models/establishment/establishment.model';
import { Establishments } from 'i4t_web/both/collections/establishment/establishment.collection';
import { Cities } from 'i4t_web/both/collections/general/city.collection';
import { EstablishmentListDetailPage } from "./establishment-list-detail/establishment-list-detail";
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { Network } from '@ionic-native/network';

@Component({
    templateUrl: 'establishment-list.html'
})
export class EstablishmentListPage implements OnInit, OnDestroy {

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishmentSubscription: Subscription;
    private _citySubscription: Subscription;

    private _establishments: Observable<Establishment[]>;
    private disconnectSubscription: Subscription;

    constructor(public _translate: TranslateService,
        public _navCtrl: NavController,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageServiceProvider,
        public _alertCtrl: AlertController,
        public _platform: Platform,
        private _network: Network) {
        _translate.setDefaultLang('en');
    }

    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._establishmentSubscription = MeteorObservable.subscribe('getEstablishments', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({}).zone();
            });
        });
        this._citySubscription = MeteorObservable.subscribe('cities').takeUntil(this.ngUnsubscribe).subscribe();
    }

    getCityName(_pIdCity: string): string {
        let city = Cities.findOne({ _id: _pIdCity });
        if (city) {
            return ", " + city.name;
        }
        return "";
    }

    /**
    * Go to establishment profile
    * @param _pEstablishment 
    */
    viewEstablishmentProfile(_pEstablishment: any) {
        this._navCtrl.push(EstablishmentListDetailPage, { establishment: _pEstablishment });
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
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    ngOnDestroy() {
        this.removeSubscriptions();
    }

    /**
   * Remove all subscriptions
   */
    removeSubscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
    }
}