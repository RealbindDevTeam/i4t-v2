import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { NavController, NavParams, Content, Select, AlertController, Platform } from 'ionic-angular';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Establishments } from 'i4t_web/both/collections/establishment/establishment.collection';
import { Cities } from 'i4t_web/both/collections/general/city.collection';
import { Countries } from 'i4t_web/both/collections/general/country.collection';
import { Sections } from 'i4t_web/both/collections/menu/section.collection';
import { Categories } from 'i4t_web/both/collections/menu/category.collection';
import { Subcategories } from 'i4t_web/both/collections/menu/subcategory.collection';
import { Item } from 'i4t_web/both/models/menu/item.model';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { ItemDetailPage } from '../item-detail/item-detail';
import { AdditionsPage } from './additions/additions';
import { Tables } from 'i4t_web/both/collections/establishment/table.collection';
import { Storage } from '@ionic/storage';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { EstablishmentProfilePage } from '../establishment-profile/establishment-profile';
import { Order } from 'i4t_web/both/models/establishment/order.model';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';
import { UserDetail, UserRewardPoints } from 'i4t_web/both/models/auth/user-detail.model';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { OrderConfirmPage } from '../orders/order-confirm/order-confirm';
import { RewardListComponent } from '../orders/reward-list';
import { Network } from '@ionic-native/network';

@Component({
  selector: 'page-sections',
  templateUrl: 'sections.html'
})
export class SectionsPage implements OnInit, OnDestroy {

  @ViewChild(Content) content: Content;
  @ViewChild('select1') select1: Select;

  private _userLang: string;
  private _sections;
  private _sectionsFilter;
  private _sectionsSub: Subscription;
  private _establishments: any;
  private _establishmentSub: Subscription;
  private _cities;
  private _citySub: Subscription;
  private _countries;
  private _countrySub: Subscription;
  private _categories;
  private _categorySub: Subscription;
  private _subcategories;
  private _subcategorySub: Subscription;
  private _items;
  private _itemsRecommended;
  private _itemSub: Subscription;
  private _additions;
  private _additionsSub: Subscription;
  private _table;
  private _tablesSub: Subscription;
  private _userDetailSub: Subscription;
  private _userDetails: Observable<UserDetail[]>;
  private _orders: Observable<Order[]>;
  private _ordersSub: Subscription;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  private _userDetail: UserDetail;
  private _res_code: string = '';
  private _table_code: string = '';
  private selected: string;
  private _item_code: string;
  private _additionsShow: boolean = false;
  private _statusArray = ['ORDER_STATUS.SELECTING'];
  private _thereAreOrders: boolean = false;
  private _userRewardPoints: number = 0;

  private disconnectSubscription: Subscription;

  constructor(public _navCtrl: NavController,
    public _navParams: NavParams,
    public _translate: TranslateService,
    public _storage: Storage,
    private _userLanguageService: UserLanguageServiceProvider,
    private _ngZone: NgZone,
    public _alertCtrl: AlertController,
    public _platform: Platform,
    private _network: Network) {
    _translate.setDefaultLang('en');
    this._res_code = this._navParams.get("res_id");
    this._table_code = this._navParams.get("table_id");
    this.selected = 'all';
  }

  ngOnInit() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    this.removeSubscriptions();
    this._sectionsSub = MeteorObservable.subscribe('sectionsByEstablishment', this._res_code).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._sections = Sections.find({});
      this._sectionsFilter = Sections.find({});
    });
    this._establishmentSub = MeteorObservable.subscribe('getEstablishmentByCurrentUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        this._establishments = Establishments.findOne({});
      });
    });
    this._citySub = MeteorObservable.subscribe('getCityByEstablishmentId', this._res_code).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._cities = Cities.find({});
    });
    this._countrySub = MeteorObservable.subscribe('getCountryByEstablishmentId', this._res_code).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._countries = Countries.find({});
    });
    this._categorySub = MeteorObservable.subscribe('categoriesByEstablishment', this._res_code).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._categories = Categories.find({});
    });
    this._subcategorySub = MeteorObservable.subscribe('subcategoriesByEstablishment', this._res_code).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._subcategories = Subcategories.find({});
    });
    this._itemSub = MeteorObservable.subscribe('itemsByEstablishment', this._res_code).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._items = Items.find({});
      this._itemsRecommended = Items.find({ 'establishments.establishment_id': this._res_code, 'establishments.recommended': true }).zone();
    });
    this._additionsSub = MeteorObservable.subscribe('additionsByEstablishment', this._res_code).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._additions = Additions.find({});
      this._additions.subscribe(() => {
        let _lAdditions: number = Additions.collection.find({}).count();
        _lAdditions > 0 ? this._additionsShow = true : this._additionsShow = false;
      });
    });

    this._tablesSub = MeteorObservable.subscribe('getTableById', this._table_code).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._table = Tables.findOne({ _id: this._table_code });
    });

    this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        this._userDetails = UserDetails.find({ user_id: Meteor.userId() }).zone();
        this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
        if (this._userDetail) {
          this.verifyUserRewardPoints();
          this._userDetails.subscribe(() => { this.verifyUserRewardPoints() });
          this._ordersSub = MeteorObservable.subscribe('getOrdersByUserId', Meteor.userId(), this._statusArray).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
              this._orders = Orders.find({ establishment_id: this._userDetail.current_establishment, tableId: this._userDetail.current_table, status: { $in: this._statusArray } }).zone();
              this.validateOrders();
              this._orders.subscribe(() => { this.validateOrders(); });
            });
          });
        }
      });
    });
  }

  validateOrders(): void {
    Orders.collection.find({ creation_user: Meteor.userId(), establishment_id: this._userDetail.current_establishment, tableId: this._userDetail.current_table, status: { $in: this._statusArray } }).count() > 0 ? this._thereAreOrders = true : this._thereAreOrders = false;
  }

  validateSection(section_selected) {
    if (section_selected === 'all') {
      this._items = Items.find({});
      this._itemsRecommended = Items.find({ 'establishments.establishment_id': this._res_code, 'establishments.recommended': true }).zone();
      this._sections = Sections.find({});
      this._categories = Categories.find({});
      this._subcategories = Subcategories.find({});
    } else if (section_selected === 'addition') {
      this.goToAddAdditions();
    } else if (section_selected === 'recommended') {
      this._items = null;
      this._sections = null;
      this._categories = null;
      this._subcategories = null;
      this._itemsRecommended = Items.find({ 'establishments.establishment_id': this._res_code, 'establishments.recommended': true }).zone();
    }
    else {
      this._itemsRecommended = null;
      this._sections = Sections.find({ _id: section_selected });
      this._items = Items.find({ sectionId: section_selected });
      this._categories = Categories.find({ section: section_selected });
      this._subcategories = Subcategories.find({});
    }
  }

  /**
     * Verify user reward points
     */
  verifyUserRewardPoints(): void {
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: Meteor.userId() });
    if (_lUserDetail) {
      let _lRewardPoints: UserRewardPoints[] = _lUserDetail.reward_points;

      if (_lRewardPoints) {
        if (_lRewardPoints.length > 0) {
          let _lPoints: UserRewardPoints = _lUserDetail.reward_points.filter(p => p.establishment_id === this._res_code)[0];
          if (_lPoints) {
            this._userRewardPoints = _lPoints.points;
          } else {
            this._userRewardPoints = 0;
          }
        } else {
          this._userRewardPoints = 0;
        }
      }
    }
  }

  goToRewardList() {
    this._navCtrl.push(RewardListComponent, { establishment: this._res_code });
  }

  ionViewWillEnter() { //or whatever method you want to use
  }

  goTop() {

    this.select1.open();
    //this.content.scrollToTop();
    setTimeout(() => {

    }, 150);

  }

  goToDetail(_itemId) {
    this.content.scrollToTop();
    this._navCtrl.push(ItemDetailPage, { item_id: _itemId, res_id: this._res_code, table_id: this._table_code });
  }

  getItem(event) {
    this._item_code = event;
    this._navCtrl.push(ItemDetailPage, { item_id: this._item_code, res_id: this._res_code, table_id: this._table_code });
  }

  goToAddAdditions() {
    this._navCtrl.push(AdditionsPage, { res_id: this._res_code, table_id: this._table_code });
  }

  /**
    * Go to establishment profile
    * @param _pEstablishment 
    */
  viewEstablishmentProfile(_pEstablishment: any) {
    this._navCtrl.push(EstablishmentProfilePage, { establishment: _pEstablishment });
  }

  /**
   * Go to confirm page 
   */
  viewConfirmPage() {
    this._navCtrl.push(OrderConfirmPage);
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
}