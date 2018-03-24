import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { NavController, NavParams, ModalController, LoadingController, ToastController, AlertController, Platform } from 'ionic-angular';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Subject, Observable } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Addition } from 'i4t_web/both/models/menu/addition.model';
import { GarnishFoodCol } from 'i4t_web/both/collections/menu/garnish-food.collection';
import { GarnishFood } from 'i4t_web/both/models/menu/garnish-food.model';
import { Order, OrderItem, OptionReference, ValueReference, OrderOption } from 'i4t_web/both/models/establishment/order.model';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { Item } from 'i4t_web/both/models/menu/item.model';
import { Currencies } from 'i4t_web/both/collections/general/currency.collection';
import { ModalObservationsEdit } from './modal-observations-edit';
import { Storage } from '@ionic/storage';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { UserDetail, UserRewardPoints } from 'i4t_web/both/models/auth/user-detail.model';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { RewardPoints } from 'i4t_web/both/collections/establishment/reward-point.collection';
import { Option } from 'i4t_web/both/models/menu/option.model';
import { Options } from 'i4t_web/both/collections/menu/option.collection';
import { OptionValue } from 'i4t_web/both/models/menu/option-value.model';
import { OptionValues } from 'i4t_web/both/collections/menu/option-value.collection';
import { LightboxPage } from "../../../pages/general/lightbox/lightbox";
import { Network } from '@ionic-native/network';

@Component({
  selector: 'page-item-edit',
  templateUrl: 'item-edit.html'
})
export class ItemEditPage implements OnInit, OnDestroy {

  private _userLang: string;
  private _itemsSub: Subscription;
  private _additionSub: Subscription;
  private _rewardPointsSub: Subscription;
  private _ordersSub: Subscription;
  private _currenciesSub: Subscription;
  private _optionSub: Subscription;
  private _optionValuesSub: Subscription;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  private _options: Observable<Option[]>;
  private _optionValues: Observable<OptionValue[]>;

  private _item_code: string = '';
  private _item_order_index: string = '';
  private _order_code: string = '';
  private _res_code: string = '';
  private _table_code: string = '';
  private _creation_user: string = '';
  private _items;
  private _item: any[] = [];
  private _finalPrice: number;
  private _unitPrice: number;
  private _currentUserId: string;
  private _statusArray: string[];
  private _additions;
  private _createAdditions: any[];
  private _maxGarnishFoodElements: number = 0;
  private _quantityCount: number;
  private _lastQuantity: number = 1;
  private _letChange: boolean = true;
  private _disabledMinusBtn: boolean = true;
  private _observations: string = null;
  private _disabledAddBtn: boolean = false;
  private _orders;
  private _auxCounter: number = 0;
  private _orderAux;
  private _orderAdditions: any[];
  private _showCancelBtn: boolean = false;
  private _newOrderForm: FormGroup;
  private _optionsFormGroup: FormGroup = new FormGroup({});
  private _additionsFormGroup: FormGroup = new FormGroup({});
  private _currencyCode: string;
  private _finalPoints: number = 0;
  private _unitRewardPoints: number = 0;
  private _showEditBtn: boolean;
  private _optionsList: Option[] = [];
  private _radioReferences: OptionReference[] = [];
  private _orderItemOptions: OrderOption[] = [];
  private _showOptionsError: boolean = false;
  private _customerCanEdit: boolean = false;

  private disconnectSubscription: Subscription;

  constructor(public _navCtrl: NavController,
    public _navParams: NavParams,
    public _translate: TranslateService,
    public _storage: Storage,
    public _modalCtrl: ModalController,
    public _loadingCtrl: LoadingController,
    private _toastCtrl: ToastController,
    private _ngZone: NgZone,
    public _alertCtrl: AlertController,
    private _userLanguageService: UserLanguageServiceProvider,
    public _platform: Platform,
    private _network: Network) {

    this._userLang = navigator.language.split('-')[0];
    _translate.setDefaultLang('en');
    this._currentUserId = Meteor.userId();
    this._statusArray = ['ORDER_STATUS.SELECTING', 'ORDER_STATUS.CONFIRMED'];

    this._createAdditions = [];
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
    this._itemsSub = MeteorObservable.subscribe('itemsByEstablishment', this._res_code).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        MeteorObservable.autorun().subscribe(() => {
          this._items = Items.find({ _id: this._item_code }).zone();
          this._item = Items.collection.find({ _id: this._item_code }).fetch();
          for (let item of this._item) {
            this._unitPrice = this.getItemPrice(item);
            this._unitRewardPoints = item.reward_points;
          }
          this._maxGarnishFoodElements = 0;
          this._disabledAddBtn = false;
          this._additionsFormGroup.reset();
          this._optionsFormGroup.reset();
          this._orderItemOptions = [];
        });
      });
    });

    this._ordersSub = MeteorObservable.subscribe('getOrdersByTableId', this._res_code, this._table_code, this._statusArray).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._orders = Orders.find({ _id: this._order_code, creation_user: this._creation_user });
      this._orderAux = Orders.collection.find({ _id: this._order_code, creation_user: this._creation_user }).fetch()[0];
      for (let itemOrder of this._orderAux.items) {
        if (itemOrder.itemId === this._item_code && itemOrder.index === this._item_order_index) {
          this._quantityCount = itemOrder.quantity;
          this._finalPrice = itemOrder.paymentItem;
          this._finalPoints = itemOrder.reward_points;

          if (itemOrder.quantity > 1) {
            this._disabledMinusBtn = false;
          }
        }
      }

      let _optionIds: string[] = [];
      this._optionSub = MeteorObservable.subscribe('optionsByEstablishment', [this._res_code]).takeUntil(this.ngUnsubscribe).subscribe(() => {
        this._ngZone.run(() => {
          this._options = Options.find({ establishments: { $in: [this._res_code] }, is_active: true }).zone();
          this._options.subscribe(() => {

            let _actualOrder;
            _actualOrder = Orders.collection.find({ _id: this._order_code, creation_user: this._creation_user }).fetch()[0];
            if (_actualOrder.status !== 'ORDER_STATUS.SELECTING' || this._orderAux.creation_user !== this._currentUserId) {
              this._customerCanEdit = false;
            } else {
              this._customerCanEdit = true;
            }

            for (let itemOrder of _actualOrder.items) {
              if (itemOrder.itemId === this._item_code && itemOrder.index === this._item_order_index) {
                this._orderItemOptions = itemOrder.options;
              }
            }
            this._optionsList = Options.collection.find({ establishments: { $in: [this._res_code] }, is_active: true }).fetch();
            for (let option of this._optionsList) {
              let _optionExist: OrderOption[] = this._orderItemOptions.filter(opt => opt.option_id === option._id);
              if (_optionExist.length > 0) {
                if (this._optionsFormGroup.contains(option._id)) {
                  this._optionsFormGroup.controls[option._id].setValue(true);
                } else {
                  let control: FormControl;
                  if (_actualOrder.status !== 'ORDER_STATUS.SELECTING' || this._orderAux.creation_user !== this._currentUserId) {
                    control = new FormControl({ value: true, disabled: true });
                  } else {
                    control = new FormControl({ value: true, disabled: false });
                  }
                  this._optionsFormGroup.addControl(option._id, control);
                }
              } else {
                if (this, this._optionsFormGroup.contains(option._id)) {
                  this._optionsFormGroup.controls[option._id].setValue(false);
                } else {
                  let control: FormControl;
                  if (_actualOrder.status !== 'ORDER_STATUS.SELECTING' || this._orderAux.creation_user !== this._currentUserId) {
                    control = new FormControl({ value: false, disabled: true });
                  } else {
                    control = new FormControl({ value: false, disabled: false });
                  }
                  this._optionsFormGroup.addControl(option._id, control);
                }
              }
              this.createOptionsReferences(true);
            }
            Options.find({ establishments: { $in: [this._res_code] }, is_active: true }).fetch().forEach((opt) => {
              _optionIds.push(opt._id);
            });
            this._optionValuesSub = MeteorObservable.subscribe('getOptionValuesByOptionIds', _optionIds).takeUntil(this.ngUnsubscribe).subscribe(() => {
              this._ngZone.run(() => {
                this._optionValues = OptionValues.find({ option_id: { $in: _optionIds }, is_active: true }).zone();
              });
            });
          });
        });
      });
    });

    this._additionSub = MeteorObservable.subscribe('additionsByEstablishment', this._res_code).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        this._additions = Additions.find({}).zone();
        this._createAdditions = Additions.collection.find({}).fetch();

        let _actualOrder;
        _actualOrder = Orders.collection.find({ _id: this._order_code, creation_user: this._creation_user }).fetch()[0];
        for (let itemOrder of _actualOrder.items) {
          if (itemOrder.itemId === this._item_code && itemOrder.index === this._item_order_index) {
            this._orderAdditions = itemOrder.additions;
          }
        }

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

    this._rewardPointsSub = MeteorObservable.subscribe('getRewardPointsByUserId', this._currentUserId).takeUntil(this.ngUnsubscribe).subscribe();

    this._newOrderForm = new FormGroup({
      quantity: new FormControl('', [Validators.required]),
      options: this._optionsFormGroup,
      additions: this._additionsFormGroup
    });

    this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', [this._res_code]).takeUntil(this.ngUnsubscribe).subscribe(() => {
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

  /**
     * Create radio button options references
     * @param {string} _pItemId 
     */
  createOptionsReferences(_pValidateInitialOptions: boolean): void {
    this._radioReferences = [];
    let _lItem: Item = Items.findOne({ _id: this._item_code });
    _lItem.options.forEach((item_option) => {
      let _reference: OptionReference = { option_id: '', is_required: false, values: [] };
      let _valuesRef: ValueReference[] = [];
      _reference.option_id = item_option.option_id;
      _reference.is_required = item_option.is_required;
      item_option.values.forEach((item_option_value) => {
        let _value: ValueReference = { value_id: item_option_value.option_value_id, price: 0, in_use: false };
        if (item_option_value.have_price) {
          _value.price = item_option_value.price;
        }
        if (_pValidateInitialOptions) {
          let _lOrderItemOption: OrderOption = this._orderItemOptions.find(op => op.value_id === item_option_value.option_value_id);
          if (_lOrderItemOption) {
            _value.in_use = true;
          }
        }
        _valuesRef.push(_value);
      });
      _reference.values = _valuesRef;
      this._radioReferences.push(_reference);
    });
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
      this.createOptionsReferences(false);
      this._disabledAddBtn = false;
      this._optionsFormGroup.reset();
      this._additionsFormGroup.reset();
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

  /**
     * Calculate final price when option value is selected
     * @param {string} _pOptionId 
     * @param {any} _pEvent 
     */
  calculateFinalPriceOptionValue(_pOptionId: string, _pEvent: any): void {
    let _lReference: OptionReference = this._radioReferences.find(reference => reference.option_id === _pOptionId);
    _lReference.values.forEach((value) => {
      if (value.in_use) {
        this._finalPrice = this._finalPrice - (value.price * this._quantityCount);
        value.in_use = false;
      }
      if (_pEvent === value.value_id) {
        this._finalPrice = this._finalPrice + (value.price * this._quantityCount);
        value.in_use = true;
      }
    });
  }

  editOrderItem() {
    this._radioReferences.forEach((option) => {
      if (option.is_required) {
        let valid: ValueReference[] = option.values.filter(val => val.in_use === true);
        if (valid.length === 0) {
          this._showOptionsError = true;
        } else {
          this._showOptionsError = false;
        }
      }
    });

    if (!this._showOptionsError) {

      let _arrOption: any[] = Object.keys(this._newOrderForm.value.options);
      let _lOptionsToInsert: OrderOption[] = [];

      _arrOption.forEach((opt) => {
        if (this._newOrderForm.value.options[opt]) {
          let _lOrderOption: OrderOption = { option_id: opt, value_id: '' };
          let _reference: OptionReference = this._radioReferences.find(ref => ref.option_id === opt);
          _reference.values.forEach((val) => {
            if (val.in_use) {
              _lOrderOption.value_id = val.value_id;
            }
          });
          _lOptionsToInsert.push(_lOrderOption);
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
        options: _lOptionsToInsert,
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

  /**
   * Function to hide edit button if item is reward
   */
  isReward(_orderItem: OrderItem) {
    if (_orderItem.is_reward) {
      this._showEditBtn = false;
    } else {
      this._showEditBtn = true;
    }
  }

  /**
      * Function to remove the reward 
      */
  removeReward() {
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
            let orderAux: Order = Orders.findOne({ _id: this._order_code });
            let _lOrderItemToremove: OrderItem = orderAux.items.filter(o => this._item_code === o.itemId && o.index === Number(this._item_order_index) && o.is_reward)[0];
            let _lNewTotalPayment: number = orderAux.totalPayment - _lOrderItemToremove.paymentItem;

            Orders.update({ _id: orderAux._id }, { $pull: { items: { itemId: this._item_code, index: Number(this._item_order_index) } } });
            Orders.update({ _id: orderAux._id },
              {
                $set: {
                  totalPayment: _lNewTotalPayment,
                  modification_user: this._currentUserId,
                  modification_date: new Date()
                }
              }
            );

            let _lConsumerDetail: UserDetail = UserDetails.findOne({ user_id: orderAux.creation_user });
            let _lPoints: UserRewardPoints = _lConsumerDetail.reward_points.filter(p => p.establishment_id === orderAux.establishment_id)[0];
            let _lNewPoints: number = Number.parseInt(_lPoints.points.toString()) + Number.parseInt(_lOrderItemToremove.redeemed_points.toString());

            UserDetails.update({ _id: _lConsumerDetail._id }, { $pull: { reward_points: { establishment_id: orderAux.establishment_id } } });
            UserDetails.update({ _id: _lConsumerDetail._id }, { $push: { reward_points: { index: _lPoints.index, establishment_id: orderAux.establishment_id, points: _lNewPoints } } });

            let _lRedeemedPoints: number = _lOrderItemToremove.redeemed_points;
            let _lValidatePoints: boolean = true;

            RewardPoints.collection.find({ id_user: Meteor.userId(), establishment_id: orderAux.establishment_id }, { sort: { gain_date: -1 } }).fetch().forEach((pnt) => {
              if (_lValidatePoints) {
                if (pnt.difference !== null && pnt.difference !== undefined && pnt.difference !== 0) {
                  let aux: number = pnt.points - pnt.difference;
                  _lRedeemedPoints = _lRedeemedPoints - aux;
                  RewardPoints.update({ _id: pnt._id }, { $set: { difference: 0 } });
                } else if (!pnt.is_active) {
                  _lRedeemedPoints = _lRedeemedPoints - pnt.points;
                  RewardPoints.update({ _id: pnt._id }, { $set: { is_active: true } });
                  if (_lRedeemedPoints === 0) {
                    _lValidatePoints = false;
                  }
                }
              }
            });

            let _currentOrder = Orders.findOne({ _id: this._order_code });
            if (_currentOrder.items.length === 0 && _currentOrder.additions.length === 0) {
              Orders.update({ _id: _currentOrder._id }, {
                $set: {
                  status: 'ORDER_STATUS.CANCELED', modification_user: this._currentUserId,
                  modification_date: new Date()
                }
              });
            }

            this._navCtrl.pop();
            let _toastMsg = this.itemNameTraduction('MOBILE.REWARD_LIST.REWARD_DELETED');
            this.presentToast(_toastMsg);
          }
        }
      ]
    });

    alertConfirm.present();
  }

  /**
   * open image if the item
   * @param pItemImg {string}
   */
  openItemImage(pItemImg: string) {
    let contactModal = this._modalCtrl.create(LightboxPage, { item_img: pItemImg });
    contactModal.present();
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
