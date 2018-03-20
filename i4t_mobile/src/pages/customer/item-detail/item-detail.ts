import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { NavController, NavParams, ModalController, LoadingController, ToastController, AlertController, Platform } from 'ionic-angular';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription, Subject, Observable } from 'rxjs';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Addition } from 'i4t_web/both/models/menu/addition.model';
import { ModalObservations } from './modal-observations';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { Item } from 'i4t_web/both/models/menu/item.model';
import { Currencies } from 'i4t_web/both/collections/general/currency.collection';
import { Option } from 'i4t_web/both/models/menu/option.model';
import { Options } from 'i4t_web/both/collections/menu/option.collection';
import { OptionValue } from 'i4t_web/both/models/menu/option-value.model';
import { OptionValues } from 'i4t_web/both/collections/menu/option-value.collection';
import { Order, OrderItem, OrderAddition, OptionReference, ValueReference, OrderOption } from 'i4t_web/both/models/establishment/order.model';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { LightboxPage } from "../../../pages/general/lightbox/lightbox";
import { Network } from '@ionic-native/network';

/*
  Generated class for the ItemDetail page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-item-detail',
  templateUrl: 'item-detail.html'
})
export class ItemDetailPage implements OnInit, OnDestroy {

  private _userLang: string;
  private _items;
  private _itemSub: Subscription;
  private _additionSub: Subscription;
  private _currenciesSub: Subscription;
  private _optionSub: Subscription;
  private _optionValuesSub: Subscription;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  private _options: Observable<Option[]>;
  private _optionValues: Observable<OptionValue[]>;

  private _item_code: string = '';
  private _res_code: string = '';
  private _table_code: string = '';
  private _finalPrice: number;
  private _unitPrice: number;
  private _observations: string = '';
  private _additions;
  private _item: any[] = [];
  private _showAddBtn: boolean = true;
  private _quantityCount: number = 1;
  private _lastQuantity: number = 1;
  private _additionsList: any[] = [];
  private _optionsList: Option[] = [];
  private _letChange: boolean = true;
  private _disabledAddBtn: boolean = false;
  private _loadingMsg: string;
  private _toastMsg: string;
  private _disabledMinusBtn: boolean = true;
  private _statusArray: string[];
  private _currentUserId: string;
  private _currencyCode: string;
  private _finalPoints: number = 0;
  private _unitRewardPoints: number = 0;
  private _radioReferences: OptionReference[] = [];
  private _showOptionsError: boolean = false;

  private _newOrderForm: FormGroup;
  private _optionsFormGroup: FormGroup = new FormGroup({});
  private _additionsFormGroup: FormGroup = new FormGroup({});

  private disconnectSubscription: Subscription;

  constructor(public _navCtrl: NavController,
    public _navParams: NavParams,
    public _modalCtrl: ModalController,
    public _translate: TranslateService,
    public _zone: NgZone,
    public _loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private _userLanguageService: UserLanguageServiceProvider,
    public _alertCtrl: AlertController,
    public _platform: Platform,
    private _network: Network) {
    _translate.setDefaultLang('en');
    this._currentUserId = Meteor.userId();
    this._statusArray = ['ORDER_STATUS.SELECTING'];
  }

  ionViewDidLoad() { }

  ngOnInit() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    this.removeSubscriptions();
    this._item_code = this._navParams.get("item_id");
    this._res_code = this._navParams.get("res_id");
    this._table_code = this._navParams.get("table_id");

    this._itemSub = MeteorObservable.subscribe('itemsByEstablishment', this._res_code).takeUntil(this.ngUnsubscribe).subscribe(() => {

      this._zone.run(() => {
        MeteorObservable.autorun().subscribe(() => {
          this._items = Items.find({ _id: this._item_code }).zone();
          this._item = Items.collection.find({ _id: this._item_code }).fetch();
          for (let item of this._item) {
            this._finalPrice = this.getItemPrice(item);
            this._unitPrice = this.getItemPrice(item);
            let aux = item.establishments.find(element => element.establishment_id === this._res_code);
            this._showAddBtn = aux.isAvailable;
            this._unitRewardPoints = item.reward_points;
            this._finalPoints = this._unitRewardPoints;
          }
          this._quantityCount = 1;
          this._disabledAddBtn = false;
          this._letChange = false;
          this._additionsFormGroup.reset();
          this._optionsFormGroup.reset();
        });
      });
    });

    this._additionSub = MeteorObservable.subscribe('additionsByEstablishment', this._res_code).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._zone.run(() => {

        this._additions = Additions.find({}).zone();
        this._additionsList = Additions.collection.find({}).fetch();
        for (let addition of this._additionsList) {
          let control: FormControl = new FormControl(false);
          this._additionsFormGroup.addControl(addition.name, control);
        }
      });
    });

    let _optionIds: string[] = [];
    this._optionSub = MeteorObservable.subscribe('optionsByEstablishment', [this._res_code]).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._zone.run(() => {
        this._options = Options.find({ establishments: { $in: [this._res_code] }, is_active: true }).zone();
        this._options.subscribe(() => {
          this._optionsList = Options.collection.find({ establishments: { $in: [this._res_code] }, is_active: true }).fetch();
          for (let option of this._optionsList) {
            if (this._optionsFormGroup.contains(option._id)) {
              this._optionsFormGroup.controls[option._id].setValue(false);
            } else {
              let control: FormControl = new FormControl(false);
              this._optionsFormGroup.addControl(option._id, control);
            }
          }
          Options.find({ establishments: { $in: [this._res_code] }, is_active: true }).fetch().forEach((opt) => {
            _optionIds.push(opt._id);
          });
          this._optionValuesSub = MeteorObservable.subscribe('getOptionValuesByOptionIds', _optionIds).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._zone.run(() => {
              this._optionValues = OptionValues.find({ option_id: { $in: _optionIds }, is_active: true }).zone();
            });
          });
          this.createOptionsReferences(this._item_code);
        });
      });
    });

    this._newOrderForm = new FormGroup({
      quantity: new FormControl('', [Validators.required]),
      options: this._optionsFormGroup,
      additions: this._additionsFormGroup
    });
    this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', [this._res_code]).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._currencyCode = Currencies.collection.find({}).fetch()[0].code + ' ';
    });
  }

  presentModal() {
    let modal = this._modalCtrl.create(ModalObservations, { obs: this._observations });
    modal.onDidDismiss(data => {
      if (typeof data != "undefined" || data != null) {
        this._observations = data;
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
      this._disabledAddBtn = false;
      this.createOptionsReferences(this._item_code);
      this._additionsFormGroup.reset();
      this._optionsFormGroup.reset();
    }
  }

  /**
   * Create radio button options references
   * @param {string} _pItemId 
   */
  createOptionsReferences(_pItemId: string): void {
    let _lItem: Item = Items.findOne({ _id: _pItemId });
    this._radioReferences = [];
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
        _valuesRef.push(_value);
      });
      _reference.values = _valuesRef;
      this._radioReferences.push(_reference);
    });
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

  addItemToOrder() {
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
      let _lOrderItemIndex: number = 0;
      let _lOrder = Orders.collection.find({
        creation_user: this._currentUserId,
        establishment_id: this._res_code,
        tableId: this._table_code,
        status: 'ORDER_STATUS.SELECTING'
      }).fetch()[0];

      if (_lOrder) {
        _lOrderItemIndex = _lOrder.orderItemCount + 1;
      } else {
        _lOrderItemIndex = 1;
      }

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

      let _lOrderItem = {
        index: _lOrderItemIndex,
        itemId: this._item_code,
        quantity: this._quantityCount,
        observations: this._observations,
        options: _lOptionsToInsert,
        additions: _lAdditionsToInsert,
        paymentItem: this._finalPrice,
        reward_points: this._finalPoints
      };

      this._loadingMsg = this.itemNameTraduction('MOBILE.SECTIONS.LOADING_MSG');
      this._toastMsg = this.itemNameTraduction('MOBILE.SECTIONS.TOAST_MSG');

      let loading = this._loadingCtrl.create({
        content: this._loadingMsg
      });

      loading.present();

      setTimeout(() => {
        MeteorObservable.call('AddItemToOrder2', _lOrderItem, this._res_code, this._table_code, this._finalPrice, this._finalPoints).subscribe(() => {
          this._showOptionsError = false;
          loading.dismiss();
          this._navCtrl.pop();
          this.presentToast();
        }, (error) => {
          alert(`Error: ${error}`);
        });
      }, 1500);
    }
  }

  presentToast() {
    let toast = this.toastCtrl.create({
      message: this._toastMsg,
      duration: 1500,
      position: 'middle'
    });

    toast.onDidDismiss(() => {
    });

    toast.present();
  }

  setObservations() {

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

  /**
  * Function to get item avalaibility 
  */
  getItemAvailability(): boolean {
    let _itemEstablishment = this._item[0];
    let aux = _itemEstablishment.establishments.find(element => element.establishment_id === this._res_code);
    return aux.isAvailable;
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
