import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from "meteor-rxjs";
import { Subscription } from "rxjs";
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { Establishments } from 'i4t_web/both/collections/establishment/establishment.collection';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { Sections } from 'i4t_web/both/collections/menu/section.collection';
import { Categories } from 'i4t_web/both/collections/menu/category.collection';
import { Subcategories } from 'i4t_web/both/collections/menu/subcategory.collection';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { ItemCardWaiterComponent } from './item-card-waiter';
import { ItemDetailWaiterPage } from '../item-detail-waiter/item-detail-waiter';
import { AdditionsWaiterPage } from './additions-waiter/additions-waiter';

@Component({
    selector: 'establishment-menu-page',
    templateUrl: 'establishment-menu.html'
})

export class EstablishmentMenuPage implements OnInit, OnDestroy {

    private _userEstablishmentSubscription: Subscription;
    private _userDetailSubscription: Subscription;
    private _sectionsSubscription: Subscription;
    private _categoriesSubscription: Subscription;
    private _subcategoriesSubscription: Subscription;
    private _itemsSubscription: Subscription;
    private _additionsSubscription: Subscription;

    private _userDetail: any;
    private _establishments: any;
    private _sections: any;
    private _items: any;
    private _categories: any;
    private _subcategories: any;
    private _itemImagesThumbs: any;
    private _additions: any;

    private selected: string;
    private _additionsShow: boolean = false;

    constructor(public _translate: TranslateService,
        public _navCtrl: NavController,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone) {

        _translate.setDefaultLang('en');
        this.selected = 'all';
    }

    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
                if (this._userDetail) {
                    this._userEstablishmentSubscription = MeteorObservable.subscribe('getEstablishmentById', this._userDetail.establishment_work).subscribe(() => {
                        this._establishments = Establishments.find({ _id: this._userDetail.establishment_work });
                    });
                    this._sectionsSubscription = MeteorObservable.subscribe('sectionsByEstablishment', this._userDetail.establishment_work).subscribe(() => {
                        this._sections = Sections.find({});
                    });
                    this._categoriesSubscription = MeteorObservable.subscribe('categoriesByEstablishment', this._userDetail.establishment_work).subscribe(() => {
                        this._categories = Categories.find({});
                    });
                    this._subcategoriesSubscription = MeteorObservable.subscribe('subcategoriesByEstablishment', this._userDetail.establishment_work).subscribe(() => {
                        this._subcategories = Subcategories.find({});
                    });
                    this._itemsSubscription = MeteorObservable.subscribe('itemsByEstablishment', this._userDetail.establishment_work).subscribe(() => {
                        this._items = Items.find({});
                    });
                    this._additionsSubscription = MeteorObservable.subscribe('additionsByEstablishment', this._userDetail.establishment_work).subscribe(() => {
                        this._additions = Additions.find({});
                        this._additions.subscribe(() => {
                            let _lAdditions: number = Additions.collection.find({}).count();
                            _lAdditions > 0 ? this._additionsShow = true : this._additionsShow = false;
                        });
                    });
                }
            });
        });
    }

    validateSection(section_selected) {
        if (section_selected == 'all') {
            this._items = Items.find({});
            this._categories = Categories.find({});
            this._subcategories = Subcategories.find({});
        } else if (section_selected === 'addition') {
            this.goToAddAdditions();
        }
        else {
            this._items = Items.find({ sectionId: section_selected });
            this._categories = Categories.find({ section: section_selected });
            this._subcategories = Subcategories.find({});
        }
    }

    goToDetail(_itemId) {
        this._navCtrl.push(ItemDetailWaiterPage, { item_id: _itemId, res_id: this._userDetail.establishment_work });
    }

    goToAddAdditions() {
        this._navCtrl.push(AdditionsWaiterPage, { res_id: this._userDetail.establishment_work });
    }

    ngOnDestroy() {
        this.removeSubscriptions();
    }

    /**
   * Remove all subscriptions
   */
    removeSubscriptions(): void {
        if (this._userEstablishmentSubscription) { this._userEstablishmentSubscription.unsubscribe(); }
        if (this._userDetailSubscription) { this._userDetailSubscription.unsubscribe(); }
        if (this._sectionsSubscription) { this._sectionsSubscription.unsubscribe(); }
        if (this._categoriesSubscription) { this._categoriesSubscription.unsubscribe(); }
        if (this._subcategoriesSubscription) { this._subcategoriesSubscription.unsubscribe(); }
        if (this._itemsSubscription) { this._itemsSubscription.unsubscribe(); }
        if (this._additionsSubscription) { this._additionsSubscription.unsubscribe(); }
    }
}