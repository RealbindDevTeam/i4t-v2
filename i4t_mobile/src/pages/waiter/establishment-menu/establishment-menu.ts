import { Component, OnInit, OnDestroy, NgZone, ViewChild } from '@angular/core';
import { NavController, Select, AlertController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from "meteor-rxjs";
import { Subscription, Subject } from "rxjs";
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
import { Network } from '@ionic-native/network';

@Component({
    selector: 'establishment-menu-page',
    templateUrl: 'establishment-menu.html'
})

export class EstablishmentMenuPage implements OnInit, OnDestroy {

    @ViewChild('select1') select1: Select;

    private _userEstablishmentSubscription: Subscription;
    private _userDetailSubscription: Subscription;
    private _sectionsSubscription: Subscription;
    private _categoriesSubscription: Subscription;
    private _subcategoriesSubscription: Subscription;
    private _itemsSubscription: Subscription;
    private _additionsSubscription: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _userDetail: any;
    private _establishments: any;
    private _sections: any;
    private _items: any;
    private _itemsRecommended;
    private _categories: any;
    private _subcategories: any;
    private _itemImagesThumbs: any;
    private _additions: any;

    private selected: string;
    private _additionsShow: boolean = false;

    private disconnectSubscription: Subscription;

    constructor(public _translate: TranslateService,
        public _navCtrl: NavController,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone,
        public _alertCtrl: AlertController,
        public _platform: Platform,
        private _network: Network) {

        _translate.setDefaultLang('en');
        this.selected = 'all';
    }

    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
                if (this._userDetail) {
                    this._userEstablishmentSubscription = MeteorObservable.subscribe('getEstablishmentById', this._userDetail.establishment_work).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._establishments = Establishments.find({ _id: this._userDetail.establishment_work });
                    });
                    this._sectionsSubscription = MeteorObservable.subscribe('sectionsByEstablishment', this._userDetail.establishment_work).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._sections = Sections.find({});
                    });
                    this._categoriesSubscription = MeteorObservable.subscribe('categoriesByEstablishment', this._userDetail.establishment_work).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._categories = Categories.find({});
                    });
                    this._subcategoriesSubscription = MeteorObservable.subscribe('subcategoriesByEstablishment', this._userDetail.establishment_work).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._subcategories = Subcategories.find({});
                    });
                    this._itemsSubscription = MeteorObservable.subscribe('itemsByEstablishment', this._userDetail.establishment_work).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._items = Items.find({});
                        this._itemsRecommended = Items.find({ 'establishments.establishment_id': this._userDetail.establishment_work, 'establishments.recommended': true }).zone();
                    });
                    this._additionsSubscription = MeteorObservable.subscribe('additionsByEstablishment', this._userDetail.establishment_work).takeUntil(this.ngUnsubscribe).subscribe(() => {
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
        if (section_selected === 'all') {
            this._items = Items.find({});
            this._itemsRecommended = Items.find({ 'establishments.establishment_id': this._userDetail.establishment_work, 'establishments.recommended': true }).zone();
            this._categories = Categories.find({});
            this._subcategories = Subcategories.find({});
        } else if (section_selected === 'addition') {
            this.goToAddAdditions();
        } else if (section_selected === 'recommended') {
            this._items = null;
            this._itemsRecommended = Items.find({ 'establishments.establishment_id': this._userDetail.establishment_work, 'establishments.recommended': true }).zone();
        }
        else {
            this._itemsRecommended = null;
            this._items = Items.find({ sectionId: section_selected });
            this._categories = Categories.find({ section: section_selected });
            this._subcategories = Subcategories.find({});
        }
    }

    goTop() {
        this.select1.open();
        setTimeout(() => {
        }, 150);
    }

    goToDetail(_itemId) {
        this._navCtrl.push(ItemDetailWaiterPage, { item_id: _itemId, res_id: this._userDetail.establishment_work });
    }

    goToAddAdditions() {
        this._navCtrl.push(AdditionsWaiterPage, { res_id: this._userDetail.establishment_work });
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
    * This function allow translate strings
    * @param {string} _itemName 
    */
    itemNameTraduction(_itemName: string): string {
        var wordTraduced: string;
        this._translate.get(_itemName).subscribe((res: string) => {
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