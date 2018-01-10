import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { NavController, NavParams, Content } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';
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

@Component({
  selector: 'page-sections',
  templateUrl: 'sections.html'
})
export class SectionsPage implements OnInit, OnDestroy {

  @ViewChild(Content) content: Content;

  private _userLang: string;
  private _sections;
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

  private _res_code: string = '';
  private _table_code: string = '';
  private selected: string;
  private _item_code: string;
  private _additionsShow: boolean = false;

  constructor(public _navCtrl: NavController,
    public _navParams: NavParams,
    public _translate: TranslateService,
    public _storage: Storage,
    private _userLanguageService: UserLanguageServiceProvider,
    private _ngZone: NgZone) {
    _translate.setDefaultLang('en');
    this._res_code = this._navParams.get("res_id");
    this._table_code = this._navParams.get("table_id");
    this.selected = 'all';
  }

  ngOnInit() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    this.removeSubscriptions();
    this._sectionsSub = MeteorObservable.subscribe('sectionsByEstablishment', this._res_code).subscribe(() => {
      this._sections = Sections.find({});
    });
    this._establishmentSub = MeteorObservable.subscribe('getEstablishmentByCurrentUser', Meteor.userId()).subscribe(() => {
      this._ngZone.run(() => {
        this._establishments = Establishments.findOne({});
      });
    });
    this._citySub = MeteorObservable.subscribe('getCityByEstablishmentId', this._res_code).subscribe(() => {
      this._cities = Cities.find({});
    });
    this._countrySub = MeteorObservable.subscribe('getCountryByEstablishmentId', this._res_code).subscribe(() => {
      this._countries = Countries.find({});
    });
    this._categorySub = MeteorObservable.subscribe('categoriesByEstablishment', this._res_code).subscribe(() => {
      this._categories = Categories.find({});
    });
    this._subcategorySub = MeteorObservable.subscribe('subcategoriesByEstablishment', this._res_code).subscribe(() => {
      this._subcategories = Subcategories.find({});
    });
    this._itemSub = MeteorObservable.subscribe('itemsByEstablishment', this._res_code).subscribe(() => {
      this._items = Items.find({});
      this._itemsRecommended = Items.find({ 'establishments.establishment_id': this._res_code, 'establishments.recommended': true }).zone();
    });
    this._additionsSub = MeteorObservable.subscribe('additionsByEstablishment', this._res_code).subscribe(() => {
      this._additions = Additions.find({});
      this._additions.subscribe(() => {
        let _lAdditions: number = Additions.collection.find({}).count();
        _lAdditions > 0 ? this._additionsShow = true : this._additionsShow = false;
      });
    });

    this._tablesSub = MeteorObservable.subscribe('getTableById', this._table_code).subscribe(() => {
      this._table = Tables.findOne({ _id: this._table_code });
    });
  }

  validateSection(section_selected) {
    if (section_selected === 'all') {
      this._items = Items.find({});
      this._itemsRecommended = Items.find({ 'establishments.establishment_id': this._res_code, 'establishments.recommended': true }).zone();
      this._categories = Categories.find({});
      this._subcategories = Subcategories.find({});
    } else if (section_selected === 'addition') {
      this.goToAddAdditions();
    } else if (section_selected === 'recommended') {
      this._items = null;
      this._itemsRecommended = Items.find({ 'establishments.establishment_id': this._res_code, 'establishments.recommended': true }).zone();
    }
    else {
      this._itemsRecommended = null;
      this._items = Items.find({ sectionId: section_selected });
      this._categories = Categories.find({ section: section_selected });
      this._subcategories = Subcategories.find({});
    }
  }

  goTop() {
    this.content.scrollToTop();
  }

  goToDetail(_itemId) {
    this._navCtrl.push(ItemDetailPage, { item_id: _itemId, res_id: this._res_code, table_id: this._table_code });
  }

  getItem(event) {
    this._item_code = event;
    this._navCtrl.push(ItemDetailPage, { item_id: this._item_code, res_id: this._res_code, table_id: this._table_code });
  }

  goToAddAdditions() {
    this._navCtrl.push(AdditionsPage, { res_id: this._res_code, table_id: this._table_code });
  }

  ngOnDestroy() {
    this.removeSubscriptions();
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions(): void {
    if (this._sectionsSub) { this._sectionsSub.unsubscribe(); }
    if (this._establishmentSub) { this._establishmentSub.unsubscribe(); }
    if (this._citySub) { this._citySub.unsubscribe(); }
    if (this._countrySub) { this._countrySub.unsubscribe(); }
    if (this._categorySub) { this._categorySub.unsubscribe(); }
    if (this._subcategorySub) { this._subcategorySub.unsubscribe(); }
    if (this._itemSub) { this._itemSub.unsubscribe(); }
    if (this._additionsSub) { this._additionsSub.unsubscribe(); }
    if (this._tablesSub) { this._tablesSub.unsubscribe(); }
  }
}