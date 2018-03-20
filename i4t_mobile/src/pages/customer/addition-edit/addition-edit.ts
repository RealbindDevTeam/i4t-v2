import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { AlertController, NavController, NavParams, LoadingController, ToastController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { Addition } from 'i4t_web/both/models/menu/addition.model';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Order, OrderAddition } from 'i4t_web/both/models/establishment/order.model';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { Network } from '@ionic-native/network';

@Component({
    selector: 'page-additions-page',
    templateUrl: 'addition-edit.html'
})
export class AdditionEditPage implements OnInit, OnDestroy {

    private _additionsSub: Subscription;
    private _ordersSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _additionsDetailFormGroup: FormGroup = new FormGroup({});
    private _orderAddition: OrderAddition;
    private _currentOrder: Order;
    private _establishmentId: string;
    private _tableId: string;
    private _additionDetails: any;

    private _isUserAndCorrect: boolean;
    private _statusArray: string[];

    private disconnectSubscription: Subscription;

    /**
     * AdditionEditPage constructor
     * @param _alertCtrl 
     * @param _loadingCtrl 
     * @param _navCtrl 
     * @param _navParams 
     * @param _formBuilder 
     * @param _translate 
     * @param _toastCtrl 
     * @param _userLanguageService 
     */
    constructor(public _alertCtrl: AlertController,
        public _loadingCtrl: LoadingController,
        public _navCtrl: NavController,
        public _navParams: NavParams,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _toastCtrl: ToastController,
        private _userLanguageService: UserLanguageServiceProvider,
        public _platform: Platform,
        private _network: Network) {
        _translate.setDefaultLang('en');
        this._orderAddition = this._navParams.get("order_addition");
        this._currentOrder = this._navParams.get("order");
        this._establishmentId = this._navParams.get("establishment");
        this._tableId = this._navParams.get("table");

        this._statusArray = ['ORDER_STATUS.SELECTING', 'ORDER_STATUS.CONFIRMED'];
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._additionsSub = MeteorObservable.subscribe('additionsByCurrentEstablishment', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._additionDetails = Additions.find({ _id: this._orderAddition.additionId }).zone();
        });

        this._ordersSub = MeteorObservable.subscribe('getOrdersByTableId', this._establishmentId, this._tableId, this._statusArray).takeUntil(this.ngUnsubscribe).subscribe();
        this._additionsDetailFormGroup = this._formBuilder.group({
            control: new FormControl(this._orderAddition.quantity, [Validators.minLength(1), Validators.maxLength(2)])
        });

        if (this._currentOrder.creation_user === Meteor.userId()) {
            if (this._currentOrder.status === "ORDER_STATUS.SELECTING") {
                this._isUserAndCorrect = true;
                let inputControl = this._additionsDetailFormGroup.get('control');
                inputControl.enable();
            } else {
                this._isUserAndCorrect = false;
                let inputControl = this._additionsDetailFormGroup.get('control');
                inputControl.disable();
            }
        } else {
            this._isUserAndCorrect = false;
            let inputControl = this._additionsDetailFormGroup.get('control');
            inputControl.disable();
        }
    }

    /**
     * Return addition information
     * @param {Addition} _pAddition
     */
    getAdditionInformation(_pAddition: Addition): string {
        return _pAddition.name + ' - ' + _pAddition.establishments.filter(r => r.establishment_id === this._establishmentId)[0].price + ' ';
    }

    /**
    * Function that allows show comfirm dialog
    */
    showComfirmClose() {
        let btn_no = this.itemNameTraduction('MOBILE.ORDERS.NO_ANSWER');
        let btn_yes = this.itemNameTraduction('MOBILE.ORDERS.YES_ANSWER');
        let content = this.itemNameTraduction('MOBILE.ORDERS.DELETE_ADDITION_CONFIRM');

        let prompt = this._alertCtrl.create({
            message: content,
            buttons: [
                {
                    text: btn_no,
                    handler: data => {
                    }
                },
                {
                    text: btn_yes,
                    handler: data => {
                        this.deleteOrderAddition();
                    }
                }
            ]
        });
        prompt.present();
    }

    /**
     * Delete OrderAddition in order
     */
    deleteOrderAddition(): void {
        let loading_msg = this.itemNameTraduction('MOBILE.WAITER_CALL.LOADING');
        let loading = this._loadingCtrl.create({
            content: loading_msg
        });
        loading.present();
        setTimeout(() => {
            let _lOrderAdditionToremove: OrderAddition = this._currentOrder.additions.filter(ad => ad.additionId === this._orderAddition.additionId)[0];
            let _lNewTotalPayment: number = this._currentOrder.totalPayment - _lOrderAdditionToremove.paymentAddition;

            Orders.update({ _id: this._currentOrder._id }, { $pull: { additions: { additionId: this._orderAddition.additionId } } });
            Orders.update({ _id: this._currentOrder._id },
                {
                    $set: {
                        totalPayment: _lNewTotalPayment,
                        modification_user: Meteor.userId(),
                        modification_date: new Date()
                    }
                }
            );

            //this._currentOrder = Orders.findOne({ _id: this._currentOrder._id });

            this._currentOrder = Orders.findOne({ _id: this._currentOrder._id });

            if ((this._currentOrder.items.length == 0) &&
                (this._currentOrder.additions.length == 0) &&
                (this._currentOrder.status === 'ORDER_STATUS.SELECTING')) {
                Orders.update({ _id: this._currentOrder._id }, {
                    $set: {
                        status: 'ORDER_STATUS.CANCELED',
                        modification_user: Meteor.userId(),
                        modification_date: new Date()
                    }
                });
            }
            this._navCtrl.pop();
            loading.dismiss();
            let msg = this.itemNameTraduction('MOBILE.ORDERS.ADDITION_DELETED');
            this.presentToast(msg);
        }, 1000);
    }

    /**
    * Function that allow show a toast confirmation
    */
    presentToast(_pMsg: string) {
        let toast = this._toastCtrl.create({
            message: _pMsg,
            duration: 1500,
            position: 'middle'
        });
        toast.onDidDismiss(() => {
        });
        toast.present();
    }

    /**
     * Modify addition in order
     */
    editOrderAddition(): void {
        let arrAdd: any[] = Object.keys(this._additionsDetailFormGroup.value);
        let _lOrderAddition: OrderAddition;

        arrAdd.forEach((add) => {
            if (this._additionsDetailFormGroup.value[add]) {
                let _lAddition: Addition = Additions.findOne({ _id: this._orderAddition.additionId });
                _lOrderAddition = {
                    additionId: this._orderAddition.additionId,
                    quantity: this._additionsDetailFormGroup.value[add],
                    paymentAddition: (this.getAdditionPrice(_lAddition) * (this._additionsDetailFormGroup.value[add]))
                };
            }
        });
        let _lOrderAdditionToremove: OrderAddition = this._currentOrder.additions.filter(ad => ad.additionId === _lOrderAddition.additionId)[0];
        let _lNewTotalPayment: number = this._currentOrder.totalPayment - _lOrderAdditionToremove.paymentAddition;

        Orders.update({ _id: this._currentOrder._id }, { $pull: { additions: { additionId: _lOrderAdditionToremove.additionId } } });
        Orders.update({ _id: this._currentOrder._id },
            {
                $set: {
                    totalPayment: _lNewTotalPayment,
                    modification_user: Meteor.userId(),
                    modification_date: new Date()
                }
            }
        );
        let _lOrder = Orders.findOne({ _id: this._currentOrder._id });
        let _lTotalPaymentAux: number = Number.parseInt(_lOrder.totalPayment.toString()) + Number.parseInt(_lOrderAddition.paymentAddition.toString());

        Orders.update({ _id: _lOrder._id },
            { $push: { additions: _lOrderAddition } }
        );
        Orders.update({ _id: _lOrder._id },
            {
                $set: {
                    modification_user: Meteor.userId(),
                    modification_date: new Date(),
                    totalPayment: _lTotalPaymentAux
                }
            }
        );
        this._currentOrder = Orders.findOne({ _id: this._currentOrder._id });
        this._navCtrl.pop();
        let msg = this.itemNameTraduction('MOBILE.ORDERS.ADDITION_EDITED');
        this.presentToast(msg);
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