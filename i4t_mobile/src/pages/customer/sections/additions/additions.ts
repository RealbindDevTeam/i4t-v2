import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { NavController, NavParams, ToastController, AlertController, Platform } from 'ionic-angular';
import { Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Addition } from 'i4t_web/both/models/menu/addition.model';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { OrderAddition } from 'i4t_web/both/models/establishment/order.model';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { Network } from '@ionic-native/network';

@Component({
    selector: 'page-add-additions',
    templateUrl: 'additions.html'
})
export class AdditionsPage implements OnInit, OnDestroy {

    private _additionsDetailFormGroup: FormGroup = new FormGroup({});
    private _additionsFormGroup: FormGroup = new FormGroup({});
    private _additionsSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    private _additions: any;

    private _establishmentId: string;
    private _tableId: string;

    private disconnectSubscription: Subscription;

    /**
     * AdditionsPage constructor
     */
    constructor(public _navCtrl: NavController,
        public _navParams: NavParams,
        private _translate: TranslateService,
        private _toastCtrl: ToastController,
        private _userLanguageService: UserLanguageServiceProvider,
        public alertCtrl: AlertController,
        public _platform: Platform,
        private _network: Network) {
        _translate.setDefaultLang('en');
        this._establishmentId = this._navParams.get("res_id");
        this._tableId = this._navParams.get("table_id");
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._additionsSub = MeteorObservable.subscribe('additionsByEstablishment', this._establishmentId).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._additions = Additions.find({}).zone();
            this._additions.subscribe(() => { this.buildAdditionsForms(); });
        });
    }

    /**
     * Build controls in additions forms
     */
    buildAdditionsForms(): void {
        Additions.collection.find({}).fetch().forEach((add) => {
            if (this._additionsFormGroup.contains(add._id)) {
                this._additionsFormGroup.controls[add._id].setValue(false);
            } else {
                let control: FormControl = new FormControl(false);
                this._additionsFormGroup.addControl(add._id, control);
            }

            if (this._additionsDetailFormGroup.contains(add._id)) {
                this._additionsDetailFormGroup.controls[add._id].setValue('');
            } else {
                let control: FormControl = new FormControl('', [Validators.minLength(1), Validators.maxLength(2)]);
                this._additionsDetailFormGroup.addControl(add._id, control);
            }
        });
    }

    /**
     * Return addition information
     * @param {Addition} _pAddition
     */
    getAdditionInformation(_pAddition: Addition): string {
        return _pAddition.name + ' - ' + _pAddition.establishments.filter(r => r.establishment_id === this._establishmentId)[0].price + ' ';
    }

    /**
     * Add Additions to Order
     */
    AddAdditionsToOrder(): void {
        let _lOrderAdditionsToInsert: OrderAddition[] = [];
        let _lAdditionsPrice: number = 0;
        let arrAdd: any[] = Object.keys(this._additionsDetailFormGroup.value);

        arrAdd.forEach((add) => {
            if (this._additionsDetailFormGroup.value[add]) {
                let _lAddition: Addition = Additions.findOne({ _id: add });
                let _lOrderAddition: OrderAddition = {
                    additionId: add,
                    quantity: this._additionsDetailFormGroup.value[add],
                    paymentAddition: (this.getAdditionPrice(_lAddition) * (this._additionsDetailFormGroup.value[add]))
                };
                _lAdditionsPrice += _lOrderAddition.paymentAddition;
                _lOrderAdditionsToInsert.push(_lOrderAddition);
            }
        });
        MeteorObservable.call('AddAdditionsToOrder2', _lOrderAdditionsToInsert, this._establishmentId, this._tableId, _lAdditionsPrice).subscribe(() => {
            let _lMessage: string = this.itemNameTraduction('MOBILE.ORDERS.ADDITON_AGGREGATED');
            let toast = this._toastCtrl.create({
                message: _lMessage,
                duration: 1500,
                position: 'middle'
            });
            toast.onDidDismiss(() => {
            });
            toast.present();
        }, (error) => { alert(`Error: ${error}`); });
        this._navCtrl.pop();
    }

    /**
     * Return Addition price
     * @param {Addition} _pAddition 
     */
    getAdditionPrice(_pAddition: Addition): number {
        return _pAddition.establishments.filter(r => r.establishment_id === this._establishmentId)[0].price;
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
        let alert = this.alertCtrl.create({
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

    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
    }

    /**
     * Return traduction
     * @param {string} itemName 
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * ngOnDestroy implementation
     */
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
}