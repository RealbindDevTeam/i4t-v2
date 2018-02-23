import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Addition } from 'i4t_web/both/models/menu/addition.model';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { OrderAddition } from 'i4t_web/both/models/establishment/order.model';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';

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

    /**
     * AdditionsPage constructor
     */
    constructor(public _navCtrl: NavController,
        public _navParams: NavParams,
        private _translate: TranslateService,
        private _toastCtrl: ToastController,
        private _userLanguageService: UserLanguageServiceProvider) {
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