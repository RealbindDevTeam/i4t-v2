import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MatDialogRef, MatDialog, MatChip } from '@angular/material';
import { UserLanguageService } from '../../services/general/user-language.service';
import { Section } from '../../../../../../both/models/menu/section.model';
import { Sections } from '../../../../../../both/collections/menu/section.collection';
import { Category } from '../../../../../../both/models/menu/category.model';
import { Categories } from '../../../../../../both/collections/menu/category.collection';
import { Subcategory } from '../../../../../../both/models/menu/subcategory.model';
import { Subcategories } from '../../../../../../both/collections/menu/subcategory.collection';
import { Item } from '../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../both/collections/menu/item.collection';
import { Addition } from '../../../../../../both/models/menu/addition.model';
import { Additions } from '../../../../../../both/collections/menu/addition.collection';
import { Currencies } from '../../../../../../both/collections/general/currency.collection';
import { AlertConfirmComponent } from '../../../web/general/alert-confirm/alert-confirm.component';
import { Establishment } from '../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../both/collections/establishment/establishment.collection';
import { Option } from '../../../../../../both/models/menu/option.model';
import { Options } from '../../../../../../both/collections/menu/option.collection';
import { OptionValue } from '../../../../../../both/models/menu/option-value.model';
import { OptionValues } from '../../../../../../both/collections/menu/option-value.collection';

@Component({
    selector: 'menu-list',
    templateUrl: './menu-list.component.html',
    styleUrls: ['./menu-list.component.scss']
})
export class MenuListComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _mdDialogRef: MatDialogRef<any>;

    private _sectionsSub: Subscription;
    private _categoriesSub: Subscription;
    private _subcategoriesSub: Subscription;
    private _itemsSub: Subscription;
    private _additionsSub: Subscription;
    private _currenciesSub: Subscription;
    private _establishmentSub: Subscription;
    private _optionSub: Subscription;
    private _optionValuesSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _sections: Observable<Section[]>;
    private _sectionsFilter: Observable<Section[]>;
    private _categories: Observable<Category[]>;
    private _subcategories: Observable<Subcategory[]>;
    private _items: Observable<Item[]>;
    private _itemsRecommended: Observable<Item[]>;
    private _itemDetail: Observable<Item[]>;
    private _additions: Observable<Addition[]>;
    private _options: Observable<Option[]>;
    private _optionValues: Observable<OptionValue[]>;

    private establishmentId: string;
    private _numberColums: number = 3;
    private _currencyCode: string;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _showAdditionsOption: boolean = false;

    /**
     * MenuListComponent Constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * Show the detail header
     */
    showHeaderDetail() {
        var _lScrollTop = document.getElementById("is").scrollTop;
        if (_lScrollTop > 0) {
            document.getElementById("mt").classList.remove('header-detail-hide');
            document.getElementById("mt").classList.add('header-detail-show');
        } else {
            document.getElementById("mt").classList.remove('header-detail-show');
            document.getElementById("mt").classList.add('header-detail-hide');
        }
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        let _optionIds: string[] = [];
        this.removeSubscriptions();

        this._establishmentSub = MeteorObservable.subscribe('getEstablishmentByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this.establishmentId = Establishments.collection.find({}).fetch()[0]._id;
                this._optionSub = MeteorObservable.subscribe('optionsByEstablishment', [this.establishmentId]).takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this._options = Options.find({ establishments: { $in: [this.establishmentId] }, is_active: true }).zone();
                        this._options.subscribe(() => {
                            Options.find({ establishments: { $in: [this.establishmentId] }, is_active: true }).fetch().forEach((opt) => {
                                _optionIds.push(opt._id);
                            });
                            this._optionValuesSub = MeteorObservable.subscribe('getOptionValuesByOptionIds', _optionIds).takeUntil(this._ngUnsubscribe).subscribe(() => {
                                this._ngZone.run(() => {
                                    this._optionValues = OptionValues.find({ option_id: { $in: _optionIds }, is_active: true }).zone();
                                });
                            });
                        });
                    });
                });
            });
        });
        this._itemsSub = MeteorObservable.subscribe('getItemsByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
                this._itemsRecommended = Items.find({ 'establishments.recommended': true }).zone();
            });
        });
        this._additionsSub = MeteorObservable.subscribe('additionsByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._additions = Additions.find({}).zone();
                this.validateEstablishmentAdditions();
                this._additions.subscribe(() => { this.validateEstablishmentAdditions(); });
            });
        });
        this._sectionsSub = MeteorObservable.subscribe('getSectionsByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._sectionsFilter = Sections.find({}).zone();
                this._sections = Sections.find({}).zone();
            });
        });
        this._categoriesSub = MeteorObservable.subscribe('getCategoriesByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._categories = Categories.find({}).zone();
            });
        });
        this._subcategoriesSub = MeteorObservable.subscribe('getSubcategoriesByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._subcategories = Subcategories.find({}).zone();
            });
        });
        this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._currencyCode = Currencies.findOne({}).code + ' ';
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Show All establishment items
     */
    showAllItems(): void {
        this._itemsRecommended = Items.find({ 'establishments.recommended': true }).zone();
        this._sections = Sections.find({}).zone();
    }

    /**
     * Filter by specific section
     * @param {string} _pSectionId 
     */
    changeSection(_pSectionId: string): void {
        this._itemsRecommended = null;
        this._sections = Sections.find({ _id: _pSectionId }).zone();
    }

    /**
     * Show Items recommended
     */
    showItemsRecommended() {
        this._sections = null;
        this._itemsRecommended = Items.find({ 'establishments.recommended': true }).zone();
    }

    /**
     * Show establishment additions
     */
    showAdditions(): void {
        this.showAllItems();
        this.viewItemDetail('item-selected', true);
        this.viewItemDetail('addition-detail', false);
    }

    /**
     * This function show item information
     * @param {Item} _pItem 
     */
    showItemInformation(_pItem: Item): void {
        this._itemDetail = Items.find({ _id: _pItem._id }).zone();
        this.viewItemDetail('addition-detail', true);
        this.viewItemDetail('item-selected', false);
    }

    /**
     * Verify establishments additions
     */
    validateEstablishmentAdditions(): void {
        let _lAdditions: number = Additions.collection.find({}).count();
        _lAdditions > 0 ? this._showAdditionsOption = true : this._showAdditionsOption = false;
    }

    /**
     * Return Item price by current establishment
     * @param {Item} _pItem 
     */

    getItemPrice(_pItem: Item): number {
        return _pItem.establishments.filter(r => r.establishment_id === this.establishmentId)[0].price;
    }

    /**
     * This function allow view item detail
     * @param _pDiv 
     * @param _boolean 
     */
    viewItemDetail(_pDiv: string, _boolean: boolean): void {
        var card = document.getElementById(_pDiv);
        if (!_boolean) {
            card.classList.add('item-detail-show');
            card.classList.remove('item-detail-hidden');
        } else {
            card.classList.add('item-detail-hidden');
        }
    }

    /**
     * Return addition information
     * @param {Addition} _pAddition
     */
    getAdditionInformation(_pAddition: Addition): string {
        return _pAddition.name + ' - ' + _pAddition.establishments.filter(r => r.establishment_id === this.establishmentId)[0].price + ' ';
    }

    /**
     * Return addition price
     * @param {Addition} _pAddition 
     */
    getAdditionPrice(_pAddition: Addition): string {
        return _pAddition.establishments.filter(r => r.establishment_id === this.establishmentId)[0].price + ' ';
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
     * Function to get item avalaibility 
     */
    getItemAvailability(itemId: string): boolean {
        let _itemEstablishment: Item = Items.collection.findOne({ _id: itemId }, { fields: { _id: 1, establishments: 1 } });
        let aux = _itemEstablishment.establishments.find(element => element.establishment_id === this.establishmentId);
        if (aux) {
            return aux.isAvailable;
        }
    }


    /**
    * This function open de error dialog according to parameters 
    * @param {string} title
    * @param {string} subtitle
    * @param {string} content
    * @param {string} btnCancelLbl
    * @param {string} btnAcceptLbl
    * @param {boolean} showBtnCancel
    */
    openDialog(title: string, subtitle: string, content: string, btnCancelLbl: string, btnAcceptLbl: string, showBtnCancel: boolean) {

        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: title,
                subtitle: subtitle,
                content: content,
                buttonCancel: btnCancelLbl,
                buttonAccept: btnAcceptLbl,
                showBtnCancel: showBtnCancel
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {

            }
        });
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}