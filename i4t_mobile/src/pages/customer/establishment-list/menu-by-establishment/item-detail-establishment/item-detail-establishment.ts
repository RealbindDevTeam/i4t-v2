import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { NavController, NavParams, ModalController, LoadingController, ToastController } from 'ionic-angular';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Addition } from 'i4t_web/both/models/menu/addition.model';
import { GarnishFoodCol } from 'i4t_web/both/collections/menu/garnish-food.collection';
import { GarnishFood } from 'i4t_web/both/models/menu/garnish-food.model';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { Item } from 'i4t_web/both/models/menu/item.model';
import { Currencies } from 'i4t_web/both/collections/general/currency.collection';
import { UserLanguageServiceProvider } from '../../../../../providers/user-language-service/user-language-service';

/*
  Generated class for the ItemDetail page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'item-detail-establishment',
  templateUrl: 'item-detail-establishment.html'
})
export class ItemDetailEstablishmentPage implements OnInit, OnDestroy {

  private _userLang: string;
  private _items;
  private _itemSub: Subscription;
  private _item_code: string = '';
  private _res_code: string = '';
  private _finalPrice: number;
  private _unitPrice: number;
  private _observations: string = '';
  private _additions;
  private _additionSub: Subscription;
  private _garnishes;
  private _garnishSub: Subscription;
  private _item: any[] = [];
  private _showAddBtn: boolean = true;
  private _quantityCount: number = 1;
  private _lastQuantity: number = 1;
  private _additionsList: any[] = [];
  private _garnishFoodList: any[] = [];
  private _letChange: boolean = true;
  private _garnishFoodElementsCount: number = 0;
  private _showGarnishFoodError = false;
  private _maxGarnishFoodElements: number = 0;
  private _disabledAddBtn: boolean = false;
  private _loadingMsg: string;
  private _toastMsg: string;
  private _disabledMinusBtn: boolean = true;
  private _statusArray: string[];
  private _currentUserId: string;
  private _currenciesSub: Subscription;
  private _currencyCode: string;

  private _newOrderForm: FormGroup;
  private _garnishFormGroup: FormGroup = new FormGroup({});
  private _additionsFormGroup: FormGroup = new FormGroup({});

  constructor(public _navCtrl: NavController,
    public _navParams: NavParams,
    public _modalCtrl: ModalController,
    public _translate: TranslateService,
    public _zone: NgZone,
    public _loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private _userLanguageService: UserLanguageServiceProvider) {
    _translate.setDefaultLang('en');
    this._currentUserId = Meteor.userId();
    this._statusArray = ['ORDER_STATUS.REGISTERED'];
  }

  ionViewDidLoad() { }

  ngOnInit() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    this.removeSubscriptions();
    this._item_code = this._navParams.get("item_id");
    this._res_code = this._navParams.get("res_id");

    this._itemSub = MeteorObservable.subscribe('itemsByEstablishment', this._res_code).subscribe(() => {

      this._zone.run(() => {
        MeteorObservable.autorun().subscribe(() => {
          this._items = Items.find({ _id: this._item_code }).zone();
          this._item = Items.collection.find({ _id: this._item_code }).fetch();
          for (let item of this._item) {
            this._finalPrice = this.getItemPrice(item);
            this._unitPrice = this.getItemPrice(item);
            let aux = item.establishments.find(element => element.establishment_id === this._res_code);
            this._showAddBtn = aux.isAvailable;
          }
          this._garnishFoodElementsCount = 0;
          this._showGarnishFoodError = false;
          this._maxGarnishFoodElements = 0;
          this._quantityCount = 1;
          this._disabledAddBtn = false;
          this._letChange = false;
          this._additionsFormGroup.reset();
          this._garnishFormGroup.reset();
        });
      });
    });

    this._additionSub = MeteorObservable.subscribe('additionsByEstablishment', this._res_code).subscribe(() => {
      this._zone.run(() => {

        this._additions = Additions.find({}).zone();
        this._additionsList = Additions.collection.find({}).fetch();
        for (let addition of this._additionsList) {
          let control: FormControl = new FormControl(false);
          this._additionsFormGroup.addControl(addition.name, control);
        }
      });
    });

    this._garnishSub = MeteorObservable.subscribe('garnishFoodByEstablishment', this._res_code).subscribe(() => {
      this._zone.run(() => {
        this._garnishes = GarnishFoodCol.find({}).zone();
        this._garnishFoodList = GarnishFoodCol.collection.find().fetch();
        for (let garnishFood of this._garnishFoodList) {
          let control: FormControl = new FormControl(false);
          this._garnishFormGroup.addControl(garnishFood.name, control);
        }
      });
    });

    this._newOrderForm = new FormGroup({
      quantity: new FormControl('', [Validators.required]),
      garnishFood: this._garnishFormGroup,
      additions: this._additionsFormGroup
    });
    this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', [this._res_code]).subscribe(() => {
      this._currencyCode = Currencies.collection.find({}).fetch()[0].code + ' ';
    });
  }

  addCount() {
    this._lastQuantity = this._quantityCount;
    this._quantityCount += 1;
    this._letChange = false;
    this._disabledMinusBtn = false;
    this.calculateFinalPriceQuantity();
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
    if (this._itemSub) { this._itemSub.unsubscribe(); }
    if (this._additionSub) { this._additionSub.unsubscribe(); }
    if (this._garnishSub) { this._garnishSub.unsubscribe(); }
    if (this._currenciesSub) { this._currenciesSub.unsubscribe(); }
  }
}
