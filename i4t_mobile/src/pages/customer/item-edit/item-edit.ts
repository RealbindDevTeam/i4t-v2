import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { NavController, NavParams, ModalController, LoadingController, ToastController, AlertController } from 'ionic-angular';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Addition } from 'i4t_web/both/models/menu/addition.model';
import { GarnishFoodCol } from 'i4t_web/both/collections/menu/garnish-food.collection';
import { GarnishFood } from 'i4t_web/both/models/menu/garnish-food.model';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { Item } from 'i4t_web/both/models/menu/item.model';
import { Currencies } from 'i4t_web/both/collections/general/currency.collection';
import { ModalObservationsEdit } from './modal-observations-edit';
import { Storage } from '@ionic/storage';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';

@Component({
  selector: 'page-item-edit',
  templateUrl: 'item-edit.html'
})
export class ItemEditPage implements OnInit, OnDestroy {

  private _userLang: string;
  private _item_code: string = '';
  private _item_order_index: string = '';
  private _order_code: string = '';
  private _res_code: string = '';
  private _table_code: string = '';
  private _creation_user: string = '';
  private _items;
  private _itemsSub: Subscription;
  private _item: any[] = [];
  private _finalPrice: number;
  private _unitPrice: number;
  private _currentUserId: string;
  private _statusArray: string[];
  private _additions;
  private _additionSub: Subscription;
  private _garnishes;
  private _garnishSub: Subscription;
  private _createAdditions: any[];
  private _maxGarnishFoodElements: number = 0;
  private _quantityCount: number;
  private _lastQuantity: number = 1;
  private _letChange: boolean = true;
  private _disabledMinusBtn: boolean = true;
  private _observations: string = null;
  private _garnishFoodElementsCount: number = 0;
  private _disabledAddBtn: boolean = false;
  private _showGarnishFoodError = false;
  private _orders;
  private _ordersSub: Subscription;
  private _auxCounter: number = 0;
  private _orderAux;
  private _createdGarnishFood: any[];
  private _orderItemGarnishFood: any[];
  private _orderAdditions: any[];
  private _showCancelBtn: boolean = false;
  private _newOrderForm: FormGroup;
  private _garnishFormGroup: FormGroup = new FormGroup({});
  private _additionsFormGroup: FormGroup = new FormGroup({});
  private _currencyCode: string;
  private _currenciesSub: Subscription;
  private _finalPoints: number = 0;
  private _unitRewardPoints: number = 0;

  constructor(public _navCtrl: NavController,
    public _navParams: NavParams,
    public _translate: TranslateService,
    public _storage: Storage,
    public _modalCtrl: ModalController,
    public _loadingCtrl: LoadingController,
    private _toastCtrl: ToastController,
    private _ngZone: NgZone,
    public _alertCtrl: AlertController,
    private _userLanguageService: UserLanguageServiceProvider) {

    this._userLang = navigator.language.split('-')[0];
    _translate.setDefaultLang('en');
    this._currentUserId = Meteor.userId();
    this._statusArray = ['ORDER_STATUS.SELECTING', 'ORDER_STATUS.CONFIRMED'];

    this._createdGarnishFood = [];
    this._createAdditions = [];
    this._orderItemGarnishFood = [];
    this._orderAdditions = [];

    this._order_code = this._navParams.get("order_id");
    this._item_order_index = this._navParams.get("item_ord_ind");
    this._item_code = this._navParams.get("item_code");
    this._creation_user = this._navParams.get("creation_user");
    this._table_code = this._navParams.get("table_code");
    this._res_code = this._navParams.get("res_code");
  }

  ionViewDidLoad() {
  }

  ngOnInit() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    this.removeSubscriptions();
    this._itemsSub = MeteorObservable.subscribe('itemsByEstablishment', this._res_code).subscribe(() => {
      this._ngZone.run(() => {
        MeteorObservable.autorun().subscribe(() => {
          this._items = Items.find({ _id: this._item_code }).zone();
          this._item = Items.collection.find({ _id: this._item_code }).fetch();
          for (let item of this._item) {
            this._unitPrice = this.getItemPrice(item);
            this._unitRewardPoints = item.reward_points;
          }
          this._showGarnishFoodError = false;
          this._maxGarnishFoodElements = 0;
          this._disabledAddBtn = false;
          this._additionsFormGroup.reset();
          this._garnishFormGroup.reset();
        });
      });
    });

    this._ordersSub = MeteorObservable.subscribe('getOrdersByTableId', this._res_code, this._table_code, this._statusArray).subscribe(() => {
      //MeteorObservable.autorun().subscribe(() => {
      this._orders = Orders.find({ _id: this._order_code, creation_user: this._creation_user });
      this._orderAux = Orders.collection.find({ _id: this._order_code, creation_user: this._creation_user }).fetch()[0];
      for (let itemOrder of this._orderAux.items) {
        if (itemOrder.itemId === this._item_code && itemOrder.index === this._item_order_index) {
          this._quantityCount = itemOrder.quantity;
          this._finalPrice = itemOrder.paymentItem;
          this._finalPoints = itemOrder.reward_points;
          this._garnishFoodElementsCount = itemOrder.garnishFood.length;

          if (itemOrder.quantity > 1) {
            this._disabledMinusBtn = false;
          }
        }
      }
    });

    this._garnishSub = MeteorObservable.subscribe('garnishFoodByEstablishment', this._res_code).subscribe(() => {

      this._ngZone.run(() => {
        this._garnishes = GarnishFoodCol.find({});
        this._createdGarnishFood = GarnishFoodCol.collection.find({}).fetch();

        let _actualOrder;
        _actualOrder = Orders.collection.find({ _id: this._order_code, creation_user: this._creation_user }).fetch()[0];
        //_actualOrder.items.forEach((itemOrder) => {
        for (let itemOrder of _actualOrder.items) {
          if (itemOrder.itemId === this._item_code && itemOrder.index === this._item_order_index) {
            this._orderItemGarnishFood = itemOrder.garnishFood;
          }
        }
        //});
        for (let gar of this._createdGarnishFood) {
          let garnishExist: any[] = this._orderItemGarnishFood.filter(garnish => garnish === gar._id);
          if (garnishExist.length > 0) {
            if (this._garnishFormGroup.contains(gar.name)) {
              this._garnishFormGroup.controls[gar.name].setValue(true);
            } else {
              let control: FormControl;
              if (_actualOrder.status !== 'ORDER_STATUS.SELECTING' || this._orderAux.creation_user !== this._currentUserId) {
                control = new FormControl({ value: true, disabled: true });
              } else {
                control = new FormControl({ value: true, disabled: false });
              }
              this._garnishFormGroup.addControl(gar.name, control);
            }
          } else {
            if (this._garnishFormGroup.contains(gar.name)) {
              this._garnishFormGroup.controls[gar.name].setValue(false);
            } else {
              let control: FormControl;
              if (_actualOrder.status !== 'ORDER_STATUS.SELECTING' || this._orderAux.creation_user !== this._currentUserId) {
                control = new FormControl({ value: false, disabled: true });
              } else {
                control = new FormControl({ value: false, disabled: false });
              }
              this._garnishFormGroup.addControl(gar.name, control);
            }
          }
        }
      });
    });

    this._additionSub = MeteorObservable.subscribe('additionsByEstablishment', this._res_code).subscribe(() => {
      this._ngZone.run(() => {
        this._additions = Additions.find({}).zone();
        this._createAdditions = Additions.collection.find({}).fetch();

        let _actualOrder;
        _actualOrder = Orders.collection.find({ _id: this._order_code, creation_user: this._creation_user }).fetch()[0];
        //_actualOrder.items.forEach((itemOrder) => {
        for (let itemOrder of _actualOrder.items) {
          if (itemOrder.itemId === this._item_code && itemOrder.index === this._item_order_index) {
            this._orderAdditions = itemOrder.additions;
          }
        }
        //});

        for (let add of this._createAdditions) {
          let additionExist: any[] = this._orderAdditions.filter(addition => addition === add._id);
          if (additionExist.length > 0) {
            if (this._additionsFormGroup.contains(add.name)) {
              this._additionsFormGroup.controls[add.name].setValue(true);
            } else {
              let control: FormControl;
              if (_actualOrder.status !== 'ORDER_STATUS.SELECTING' || this._orderAux.creation_user !== this._currentUserId) {
                control = new FormControl({ value: true, disabled: true });
              } else {
                control = new FormControl({ value: true, disabled: false });
              }
              this._additionsFormGroup.addControl(add.name, control);
            }
          } else {
            if (this._additionsFormGroup.contains(add.name)) {
              this._additionsFormGroup.controls[add.name].setValue(false);
            } else {
              let control: FormControl;
              if (_actualOrder.status !== 'ORDER_STATUS.SELECTING' || this._orderAux.creation_user !== this._currentUserId) {
                control = new FormControl({ value: false, disabled: true });
              } else {
                control = new FormControl({ value: false, disabled: false });
              }
              this._additionsFormGroup.addControl(add.name, control);
            }
          }
        }
      });
    });

    this._newOrderForm = new FormGroup({
      quantity: new FormControl('', [Validators.required]),
      garnishFood: this._garnishFormGroup,
      additions: this._additionsFormGroup
    });
    //

    this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', [this._res_code]).subscribe(() => {
      this._currencyCode = Currencies.collection.find({}).fetch()[0].code + ' ';
    });
  }

  presentModal(_actualObs?: string) {
    let modal;
    if (_actualObs) {
      if (this._observations === null) {
        if (this._auxCounter == 0) {
          modal = this._modalCtrl.create(ModalObservationsEdit, { obs: _actualObs });
          this._auxCounter += 1;
        } else {
          modal = this._modalCtrl.create(ModalObservationsEdit, { obs: this._observations });
          this._auxCounter += 1;
        }
      } else {
        modal = this._modalCtrl.create(ModalObservationsEdit, { obs: this._observations });
        this._auxCounter += 1;
      }
    } else {
      if (this._observations == null) {
        this._observations = "";
      }
      modal = this._modalCtrl.create(ModalObservationsEdit, { obs: this._observations });
    }

    modal.onDidDismiss(data => {
      if (typeof data != "undefined" || data != null) {
        if (!data.toString().replace(/\s/g, '').length) {
          this._observations = null;
        } else {
          this._observations = data;
        }
      } else {
        if (this._auxCounter == 1) {
          this._observations = _actualObs;
        }
      }
    });
    modal.present();
  }

  addCount() {
    this._lastQuantity = this._quantityCount;
    this._quantityCount += 1;
    this._letChange = false;
    this._disabledMinusBtn = false;
    this.calculateFinalPriceQuantity();
    this.calculateFinalPointsQuantity();
  }

  removeCount() {
    if (this._quantityCount > 1) {
      this._lastQuantity = this._quantityCount;
      this._quantityCount -= 1;
      this._letChange = false;
      if (this._quantityCount == 1) {
        this._disabledMinusBtn = true;
      } else {
        this._disabledMinusBtn = false;
      }
    }
    this.calculateFinalPriceQuantity();
    this.calculateFinalPointsQuantity();
  }

  calculateFinalPriceQuantity() {
    if (Number.isFinite(this._quantityCount)) {
      this._finalPrice = this._unitPrice * this._quantityCount;
      this._garnishFoodElementsCount = 0;
      this._disabledAddBtn = false;
      this._showGarnishFoodError = false;
      this._additionsFormGroup.reset();
      this._garnishFormGroup.reset();
    }
  }

  /**
  * Calculate final points when item quantity is entered
  */
  calculateFinalPointsQuantity(): void {
    if (Number.isFinite(this._quantityCount)) {
      this._finalPoints = this._unitRewardPoints * this._quantityCount;
    }
  }

  calculateFinalPriceAddition(_event: any, _price: number): void {
    if (_event.checked) {
      this._finalPrice = Number.parseInt(this._finalPrice.toString()) + (Number.parseInt(_price.toString()) * this._quantityCount);
      this._letChange = true;
    } else {
      if (this._letChange) {
        this._finalPrice = Number.parseInt(this._finalPrice.toString()) - (Number.parseInt(_price.toString()) * this._quantityCount);
      }
    }
  }

  calculateFinalPriceGarnishFood(_event: any, _price: number): void {
    if (_event.checked) {
      this._finalPrice = Number.parseInt(this._finalPrice.toString()) + (Number.parseInt(_price.toString()) * this._quantityCount);
      this._garnishFoodElementsCount += 1;
      this.validateGarnishFoodElements();
      this._letChange = true;
    } else {
      if (this._letChange) {
        this._finalPrice = Number.parseInt(this._finalPrice.toString()) - (Number.parseInt(_price.toString()) * this._quantityCount);
        this._garnishFoodElementsCount -= 1;
        this.validateGarnishFoodElements();
      }
    }
  }

  validateGarnishFoodElements(): void {
    if (this._garnishFoodElementsCount > this._maxGarnishFoodElements) {
      this._showGarnishFoodError = true;
      this._disabledAddBtn = true;
    } else {
      this._showGarnishFoodError = false;
      this._disabledAddBtn = false;
    }
  }

  setMaxGarnishFoodElements(_pGarnishFoodQuantity: number) {
    this._maxGarnishFoodElements = _pGarnishFoodQuantity;
  }

  editOrderItem() {
    let arr: any[] = Object.keys(this._newOrderForm.value.garnishFood);
    let _lGarnishFoodToInsert: string[] = [];

    arr.forEach((gar) => {
      if (this._newOrderForm.value.garnishFood[gar]) {
        let _lGarnishF: GarnishFood = GarnishFoodCol.findOne({ name: gar });
        _lGarnishFoodToInsert.push(_lGarnishF._id);
      }
    });

    let arrAdd: any[] = Object.keys(this._newOrderForm.value.additions);
    let _lAdditionsToInsert: string[] = [];

    arrAdd.forEach((add) => {
      if (this._newOrderForm.value.additions[add]) {
        let _lAddition: Addition = Additions.findOne({ name: add });
        _lAdditionsToInsert.push(_lAddition._id);
      }
    });

    if (this._observations == null) {
      this._observations = "";
    }

    let _lOrderItem = {
      index: this._item_order_index,
      itemId: this._item_code,
      quantity: this._quantityCount,
      observations: this._observations,
      garnishFood: _lGarnishFoodToInsert,
      additions: _lAdditionsToInsert,
      paymentItem: this._finalPrice,
      reward_points: this._finalPoints
    };

    let _lOrder = Orders.findOne({ _id: this._order_code });
    let _lOrderItemToremove = _lOrder.items.filter(o => _lOrderItem.itemId === o.itemId && Number(_lOrderItem.index) === o.index)[0];
    let _lTotalPayment: number = _lOrder.totalPayment - _lOrderItemToremove.paymentItem;
    let _lTotalPoints: number = _lOrder.total_reward_points - _lOrderItemToremove.reward_points;

    Orders.update({ _id: this._order_code }, { $pull: { items: { itemId: this._item_code, index: this._item_order_index } } });
    Orders.update({ _id: this._order_code },
      {
        $set: {
          totalPayment: _lTotalPayment,
          total_reward_points: _lTotalPoints,
          modification_user: Meteor.userId(),
          modification_date: new Date()
        }
      }
    );

    let _lNewOrder = Orders.findOne({ _id: this._order_code });
    let _lNewTotalPaymentAux: number = Number.parseInt(_lNewOrder.totalPayment.toString()) + Number.parseInt(_lOrderItem.paymentItem.toString());
    let _lNewTotalPointsAux: number = Number.parseInt(_lNewOrder.total_reward_points.toString()) + Number.parseInt(_lOrderItem.reward_points.toString());

    Orders.update({ _id: _lNewOrder._id },
      { $push: { items: _lOrderItem } }
    );

    Orders.update({ _id: _lNewOrder._id },
      {
        $set: {
          modification_user: Meteor.userId(),
          modification_date: new Date(),
          totalPayment: _lNewTotalPaymentAux,
          total_reward_points: _lNewTotalPointsAux
        }
      }
    );

    let _toastMsg = this.itemNameTraduction('MOBILE.ITEM_EDIT.TOAST_MSG_EDIT');
    this._navCtrl.pop();
    this.presentToast(_toastMsg);
  }

  presentToast(msg: string) {
    let toast = this._toastCtrl.create({
      message: msg,
      duration: 1500,
      position: 'middle'
    });
    toast.onDidDismiss(() => {
    });
    toast.present();
  }

  deleteOrderItem() {
    let dialog_title = this.itemNameTraduction('MOBILE.ITEM_EDIT.REMOVE_ITEM');
    let dialog_subtitle = this.itemNameTraduction('MOBILE.ITEM_EDIT.SURE_REMOVE');
    let dialog_cancel_btn = this.itemNameTraduction('MOBILE.ITEM_EDIT.NO_ANSWER');
    let dialog_accept_btn = this.itemNameTraduction('MOBILE.ITEM_EDIT.YES_ANSWER');

    let alertConfirm = this._alertCtrl.create({
      title: dialog_title,
      message: dialog_subtitle,
      buttons: [
        {
          text: dialog_cancel_btn,
          role: 'cancel',
          handler: () => {
          }
        },
        {
          text: dialog_accept_btn,
          handler: () => {
            let _lOrder = Orders.findOne({ _id: this._order_code });
            let _lOrderItemToremove = _lOrder.items.filter(o => this._item_code === o.itemId && Number(this._item_order_index) === o.index)[0];
            let _lNewTotalPayment: number = _lOrder.totalPayment - _lOrderItemToremove.paymentItem;
            let _lNewTotalPoints: number = _lOrder.total_reward_points - _lOrderItemToremove.reward_points;

            Orders.update({ _id: _lOrder._id }, { $pull: { items: { itemId: this._item_code, index: this._item_order_index } } });
            Orders.update({ _id: _lOrder._id },
              {
                $set: {
                  totalPayment: _lNewTotalPayment,
                  total_reward_points: _lNewTotalPoints,
                  modification_user: Meteor.userId(),
                  modification_date: new Date()
                }
              }
            );

            let _lOrder2 = Orders.findOne({ _id: this._order_code });

            if ((_lOrder2.items.length == 0) &&
              (_lOrder2.additions.length == 0) &&
              (_lOrder2.status === 'ORDER_STATUS.SELECTING')) {
              Orders.update({ _id: _lOrder2._id }, {
                $set: {
                  status: 'ORDER_STATUS.CANCELED',
                  modification_user: Meteor.userId(),
                  modification_date: new Date()
                }
              });
            }
            this._navCtrl.pop();
            let _toastMsg = this.itemNameTraduction('MOBILE.ITEM_EDIT.TOAST_MSG_REMOVE');
            this.presentToast(_toastMsg);
          }
        }
      ]
    });
    alertConfirm.present();
  }

  itemNameTraduction(itemName: string): string {
    var wordTraduced: string;
    this._translate.get(itemName).subscribe((res: string) => {
      wordTraduced = res;
    });
    return wordTraduced;
  }

  /**
   * Return Item price by current establishment
   * @param {Item} _pItem 
   */
  getItemPrice(_pItem: Item): number {
    return _pItem.establishments.filter(r => r.establishment_id === this._res_code)[0].price;
  }

  /**
   * Return Addition price by current establishment
   * @param {Addition} _pAddition
   */
  getAdditionsPrice(_pAddition: Addition): number {
    return _pAddition.establishments.filter(r => r.establishment_id === this._res_code)[0].price;
  }

  /**
   * Return Garnish food price by current establishment
   * @param {GarnishFood} _pGarnishFood
   */
  getGarnishFoodPrice(_pGarnishFood: GarnishFood): number {
    return _pGarnishFood.establishments.filter(r => r.establishment_id === this._res_code)[0].price;
  }

  /**
   * Return item name by id
   * @param _pItemId 
   */
  getItemName(_pItemId: string): string {
    if (_pItemId) {
      return Items.findOne({ _id: _pItemId }).name;
    }
    return '';
  }

  showActionsFooter(): boolean {
    let item = Items.collection.findOne({ _id: this._item_code });
    if (item) {
      let aux = item.establishments.find(element => element.establishment_id === this._res_code);
      if (aux.isAvailable) {
        let orderAux = Orders.findOne({ _id: this._order_code, creation_user: this._creation_user });
        if (orderAux) {
          if (orderAux.status === 'ORDER_STATUS.SELECTING' && orderAux.creation_user === this._currentUserId) {
            return true;
          } else {
            return false;
          }
        }
      } else {
        return false;
      }
    }
  }

  /**
* Function to get item avalaibility 
*/
  getItemAvailability(): boolean {
    let _itemEstablishment = this._item[0];
    let aux = _itemEstablishment.establishments.find(element => element.establishment_id === this._res_code);
    return aux.isAvailable;
  }

  ngOnDestroy() {
    this.removeSubscriptions();
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions(): void {
    if (this._itemsSub) { this._itemsSub.unsubscribe(); }
    if (this._additionSub) { this._additionSub.unsubscribe(); }
    if (this._garnishSub) { this._garnishSub.unsubscribe(); }
    if (this._ordersSub) { this._ordersSub.unsubscribe(); }
    if (this._currenciesSub) { this._currenciesSub.unsubscribe(); }
  }
}
