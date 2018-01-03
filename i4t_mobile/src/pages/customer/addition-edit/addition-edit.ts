import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { AlertController, NavController, NavParams, LoadingController, ToastController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { Addition } from 'i4t_web/both/models/menu/addition.model';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Order, OrderAddition } from 'i4t_web/both/models/restaurant/order.model';
import { Orders } from 'i4t_web/both/collections/restaurant/order.collection';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';

@Component({
    selector: 'page-additions-page',
    templateUrl: 'addition-edit.html'
})
export class AdditionEditPage implements OnInit, OnDestroy {

    private _additionsSub: Subscription;
    private _ordersSub: Subscription;
    private _additionsDetailFormGroup: FormGroup = new FormGroup({});
    private _orderAddition: OrderAddition;
    private _currentOrder: Order;
    private _restaurantId: string;
    private _tableId: string;
    private _additionDetails: any;

    private _isUserAndCorrect: boolean;

    private _statusArray: string[];

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
        private _userLanguageService: UserLanguageServiceProvider) {
        _translate.setDefaultLang('en');
        this._orderAddition = this._navParams.get("order_addition");
        this._currentOrder = this._navParams.get("order");
        this._restaurantId = this._navParams.get("restaurant");
        this._tableId = this._navParams.get("table");

        this._statusArray = ['ORDER_STATUS.REGISTERED', 'ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED', 'ORDER_STATUS.DELIVERED'];
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._additionsSub = MeteorObservable.subscribe('additionsByCurrentRestaurant', Meteor.userId()).subscribe(() => {
            this._additionDetails = Additions.find({ _id: this._orderAddition.additionId }).zone();
        });

        this._ordersSub = MeteorObservable.subscribe('getOrdersByTableId', this._restaurantId, this._tableId, this._statusArray).subscribe();
        this._additionsDetailFormGroup = this._formBuilder.group({
            control: new FormControl(this._orderAddition.quantity, [Validators.minLength(1), Validators.maxLength(2)])
        });

        if (this._currentOrder.creation_user === Meteor.userId()) {
            if (this._currentOrder.status === "ORDER_STATUS.REGISTERED") {
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
        return _pAddition.name + ' - ' + _pAddition.restaurants.filter(r => r.restaurantId === this._restaurantId)[0].price + ' ';
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
                (this._currentOrder.status === 'ORDER_STATUS.REGISTERED')) {
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
        return _pAddition.restaurants.filter(r => r.restaurantId === this._restaurantId)[0].price;
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
        if (this._additionsSub) { this._additionsSub.unsubscribe(); }
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
    }
}