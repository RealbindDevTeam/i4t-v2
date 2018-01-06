import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog, MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { ItemEstablishment, ItemPrice, ItemImage } from '../../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../../both/collections/menu/item.collection';
import { Sections } from '../../../../../../../../both/collections/menu/section.collection';
import { Section } from '../../../../../../../../both/models/menu/section.model';
import { Categories } from '../../../../../../../../both/collections/menu/category.collection';
import { Category } from '../../../../../../../../both/models/menu/category.model';
import { Subcategory } from '../../../../../../../../both/models/menu/subcategory.model';
import { Subcategories } from '../../../../../../../../both/collections/menu/subcategory.collection';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { GarnishFood } from '../../../../../../../../both/models/menu/garnish-food.model';
import { GarnishFoodCol } from '../../../../../../../../both/collections/menu/garnish-food.collection';
import { Addition } from '../../../../../../../../both/models/menu/addition.model';
import { Additions } from '../../../../../../../../both/collections/menu/addition.collection';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { Country } from '../../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../../both/collections/general/country.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';
import { ImageService } from '../../../../services/general/image.service';

@Component({
    selector: 'item-creation',
    templateUrl: './item-creation.component.html',
    styleUrls: ['./item-creation.component.scss']
})

export class ItemCreationComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _itemForm: FormGroup;
    private _garnishFormGroup: FormGroup = new FormGroup({});
    private _additionsFormGroup: FormGroup = new FormGroup({});
    private _establishmentsFormGroup: FormGroup = new FormGroup({});
    private _currenciesFormGroup: FormGroup = new FormGroup({});
    private _taxesFormGroup: FormGroup = new FormGroup({});
    private _mdDialogRef: MatDialogRef<any>;

    private _sections: Observable<Section[]>;
    private _categories: Observable<Category[]>;
    private _subcategories: Observable<Subcategory[]>;
    private _currencies: Observable<Currency[]>;

    private _itemsSub: Subscription;
    private _sectionsSub: Subscription;
    private _categorySub: Subscription;
    private _subcategorySub: Subscription;
    private _establishmentSub: Subscription;
    private _garnishFoodSub: Subscription;
    private _additionSub: Subscription;
    private _currenciesSub: Subscription;
    private _countriesSub: Subscription;

    private _establishmentList: Establishment[] = [];
    private _establishmentCurrencies: string[] = [];
    private _establishmentTaxes: string[] = [];
    private _garnishFood: GarnishFood[] = [];
    private _additions: Addition[] = [];

    private _showGarnishFood: boolean = false;
    private _createImage: boolean = false;
    private _showAdditions: boolean = false;
    private _showEstablishments: boolean = false;
    private _showCurrencies: boolean = false;
    private _showTaxes: boolean = false;
    private _loading: boolean = false;

    public _selectedIndex: number = 0;
    private _itemImageToInsert: ItemImage;
    private _nameImageFile: string;
    private _establishmentsSelectedCount: number = 0;

    private _selectedSectionValue: string;
    private _selectedCategoryValue: string;
    private _selectedSubcategoryValue: string;
    private titleMsg: string;
    private btnAcceptLbl: string;

    private _rewardEnable: boolean = false;
    private _cookingTimeArray: any[];
    private _rewardPointsArray: any[];

    /**
     * ItemComponent constructor
     * @param {FormBuilder} _formBuilder
     * @param {TranslateService} _translate
     * @param {NgZone} _ngZone
     * @param {Router} _router
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        private _router: Router,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog,
        private _imageService: ImageService,
        private _snackBar: MatSnackBar) {
        let _lng: string = this._userLanguageService.getLanguage(Meteor.user());
        _translate.use(_lng);
        _translate.setDefaultLang('en');
        this._imageService.setPickOptionsLang(_lng);
        this._selectedSectionValue = "";
        this._selectedCategoryValue = "";
        this._selectedSubcategoryValue = "";
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * Implements ngOnInit function
     */
    ngOnInit() {
        this.removeSubscriptions();
        let _establishmentsId: string[] = [];
        this._itemForm = new FormGroup({
            section: new FormControl('', [Validators.required]),
            category: new FormControl(''),
            subcategory: new FormControl(''),
            name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(55)]),
            description: new FormControl('', [Validators.minLength(1), Validators.maxLength(200)]),
            cookingTime: new FormControl(''),
            establishments: this._establishmentsFormGroup,
            currencies: this._currenciesFormGroup,
            taxes: this._taxesFormGroup,
            observations: new FormControl(false),
            image: new FormControl(''),
            garnishFoodQuantity: new FormControl('0'),
            garnishFood: this._garnishFormGroup,
            additions: this._additionsFormGroup,
            acceptReward: new FormControl(false),
            rewardValue: new FormControl('')
        });

        this._sectionsSub = MeteorObservable.subscribe('sections', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._sections = Sections.find({ is_active: true }).zone();
            });
        });
        this._categorySub = MeteorObservable.subscribe('categories', this._user).subscribe();
        this._subcategorySub = MeteorObservable.subscribe('subcategories', this._user).subscribe();
        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).subscribe(() => {
            this._ngZone.run(() => {
                Establishments.collection.find({}).fetch().forEach((res) => {
                    _establishmentsId.push(res._id);
                });
                this._countriesSub = MeteorObservable.subscribe('getCountriesByEstablishmentsId', _establishmentsId).subscribe();
                this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', _establishmentsId).subscribe();
                this._currencies = Currencies.find({}).zone();
            });
        });
        this._itemsSub = MeteorObservable.subscribe('items', this._user).subscribe();
        this._garnishFoodSub = MeteorObservable.subscribe('garnishFood', this._user).subscribe();
        this._additionSub = MeteorObservable.subscribe('additions', this._user).subscribe();


        this._cookingTimeArray = [{ value: "5 min aprox", label: "5 min aprox" }, { value: "15 min aprox", label: "15 min aprox" },
        { value: "30 min aprox", label: "30 min aprox" }, { value: "45 min aprox", label: "45 min aprox" },
        { value: "1 h aprox", label: "1 h aprox" }, { value: "1 h 15 min aprox", label: "1 h 15 min aprox" },
        { value: "1 h 30 min aprox", label: "1 h 30 min aprox" }, { value: "1 h 45 min aprox", label: "1 h 45 min aprox" },
        { value: "2 h aprox", label: "2 h aprox" }, { value: "+ 2 h aprox", label: "+ 2 h aprox" }];

        this._rewardPointsArray = [{ value: 1, label: "1 pt" }, { value: 2, label: "2 pts" }, { value: 3, label: "3 pts" }, { value: 4, label: "4 pts" }, { value: 5, label: "5 pts" },
        { value: 6, label: "6 pts" }, { value: 7, label: "7 pts" }, { value: 8, label: "8 pts" }, { value: 9, label: "9 pts" }, { value: 10, label: "10 pts" }];
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._sectionsSub) { this._sectionsSub.unsubscribe(); }
        if (this._categorySub) { this._categorySub.unsubscribe(); }
        if (this._subcategorySub) { this._subcategorySub.unsubscribe(); }
        if (this._establishmentSub) { this._establishmentSub.unsubscribe(); }
        if (this._garnishFoodSub) { this._garnishFoodSub.unsubscribe(); }
        if (this._itemsSub) { this._itemsSub.unsubscribe(); }
        if (this._additionSub) { this._additionSub.unsubscribe(); }
        if (this._currenciesSub) { this._currenciesSub.unsubscribe(); }
        if (this._countriesSub) { this._countriesSub.unsubscribe(); }
    }

    /**
     * This function get selectedIndex
     */
    get selectedIndex(): number {
        return this._selectedIndex;
    }

    /**
     * This function set selectedIndex
     * @param {number} _selectedIndex
     */
    set selectedIndex(_selectedIndex: number) {
        this._selectedIndex = _selectedIndex;
    }

    /**
     * This function allow move in wizard tabs
     * @param {number} _index
     */
    canMove(_index: number): boolean {
        switch (_index) {
            case 0:
                return true;
            case 1:
                if (this._itemForm.controls['section'].valid) {
                    return true;
                } else {
                    return false;
                }
            case 2:
                if (this._itemForm.controls['name'].valid && this._itemForm.controls['description'].valid &&
                    this._itemForm.controls['cookingTime'].valid && this._establishmentsSelectedCount > 0) {
                    return true
                } else {
                    return false;
                }
            default:
                return true;
        }
    }

    /**
     * This function move to the next tab
     */
    next(): void {
        if (this.canMove(this._selectedIndex + 1)) {
            this._selectedIndex++;
        }
    }

    /**
     * This function move to the previous tab
     */
    previous(): void {
        if (this._selectedIndex === 0) {
            return;
        }
        if (this.canMove(this._selectedIndex - 1)) {
            this._selectedIndex--;
        }
    }

    /**
     * This fuction allow wizard to create item
     */
    canFinish(): boolean {
        return this._itemForm.valid;
    }

    /**
     * Show Garnish Food Quantity Message
     */
    showGarnishFoodQuantityMsg(): boolean {
        let arrGarnishFood: any[] = Object.keys(this._itemForm.value.garnishFood);
        let _lGarnish: string[] = [];
        let _lGarnishQuantOk: boolean = false;

        arrGarnishFood.forEach((gar) => {
            if (this._itemForm.value.garnishFood[gar]) {
                _lGarnish.push(gar);
            }
        });
        if (_lGarnish.length > 0) {
            if (this._itemForm.value.garnishFoodQuantity === '0' || this._itemForm.value.garnishFoodQuantity === 0) {
                _lGarnishQuantOk = false;
            } else {
                _lGarnishQuantOk = true;
            }
        } else {
            _lGarnishQuantOk = true;
        }
        return _lGarnishQuantOk;
    }

    /**
     * Function to add Item
     */
    addItem(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._itemForm.valid) {
            this._loading = true;
            setTimeout(() => {
                this.createNewItem().then((item_id) => {
                    this._loading = false;
                    let _lMessage: string = this.itemNameTraduction('ITEMS.ITEM_CREATED');
                    this._snackBar.open(_lMessage, '', { duration: 2500 });
                    this._router.navigate(['app/items']);
                }).catch((err) => {
                    this._loading = false;
                    this._router.navigate(['app/items']);
                    var error: string = this.itemNameTraduction('ITEMS.CREATION_ERROR');
                    this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
                });
            }, 2000);
        } else {
            this.cancel();
        }
    }

    /**
     * Promise to create new item
     */
    createNewItem(): Promise<string> {
        let _lNewItem: string;

        return new Promise((resolve, reject) => {
            try {
                let arrCur: any[] = Object.keys(this._itemForm.value.currencies);
                let _lItemEstablishmentsToInsert: ItemEstablishment[] = [];
                let _lItemPricesToInsert: ItemPrice[] = [];

                arrCur.forEach((cur) => {
                    let find: Establishment[] = this._establishmentList.filter(r => r.currencyId === cur);
                    for (let es of find) {
                        if (this._itemForm.value.establishments[es._id]) {
                            let _lItemEstablishment: ItemEstablishment = { establishment_id: '', price: 0, isAvailable: true, recommended: false };

                            _lItemEstablishment.establishment_id = es._id;
                            _lItemEstablishment.price = this._itemForm.value.currencies[cur];

                            if (this._itemForm.value.taxes[cur] !== undefined) {
                                _lItemEstablishment.itemTax = this._itemForm.value.taxes[cur];
                            }

                            _lItemEstablishmentsToInsert.push(_lItemEstablishment);
                        }
                    }
                    if (cur !== null && this._itemForm.value.currencies[cur] !== null) {
                        let _lItemPrice: ItemPrice = { currencyId: '', price: 0 };
                        _lItemPrice.currencyId = cur;
                        _lItemPrice.price = this._itemForm.value.currencies[cur];
                        if (this._itemForm.value.taxes[cur] !== undefined) {
                            _lItemPrice.itemTax = this._itemForm.value.taxes[cur];
                        }
                        _lItemPricesToInsert.push(_lItemPrice);
                    }
                });

                let arr: any[] = Object.keys(this._itemForm.value.garnishFood);
                let _lGarnishFoodToInsert: string[] = [];

                arr.forEach((gar) => {
                    if (this._itemForm.value.garnishFood[gar]) {
                        _lGarnishFoodToInsert.push(gar);
                    }
                });

                let arrAdd: any[] = Object.keys(this._itemForm.value.additions);
                let _lAdditionsToInsert: string[] = [];

                arrAdd.forEach((add) => {
                    if (this._itemForm.value.additions[add]) {
                        _lAdditionsToInsert.push(add);
                    }
                });

                let rewardPointsAux: number;
                if (this._itemForm.value.acceptReward) {
                    rewardPointsAux = this._itemForm.value.rewardValue
                } else {
                    rewardPointsAux = 0;
                }

                if (this._createImage) {
                    _lNewItem = Items.collection.insert({
                        creation_user: this._user,
                        creation_date: new Date(),
                        modification_user: '-',
                        modification_date: new Date(),
                        is_active: true,
                        sectionId: this._itemForm.value.section,
                        categoryId: this._itemForm.value.category,
                        subcategoryId: this._itemForm.value.subcategory,
                        name: this._itemForm.value.name,
                        time: this._itemForm.value.cookingTime,
                        description: this._itemForm.value.description,
                        establishments: _lItemEstablishmentsToInsert,
                        prices: _lItemPricesToInsert,
                        observations: this._itemForm.value.observations,
                        image: this._itemImageToInsert,
                        garnishFoodQuantity: this._itemForm.value.garnishFoodQuantity,
                        garnishFood: _lGarnishFoodToInsert,
                        additions: _lAdditionsToInsert,
                        has_reward: this._itemForm.value.acceptReward,
                        reward_points: rewardPointsAux
                    });
                } else {
                    _lNewItem = Items.collection.insert({
                        creation_user: this._user,
                        creation_date: new Date(),
                        modification_user: '-',
                        modification_date: new Date(),
                        is_active: true,
                        sectionId: this._itemForm.value.section,
                        categoryId: this._itemForm.value.category,
                        subcategoryId: this._itemForm.value.subcategory,
                        name: this._itemForm.value.name,
                        time: this._itemForm.value.cookingTime,
                        description: this._itemForm.value.description,
                        establishments: _lItemEstablishmentsToInsert,
                        prices: _lItemPricesToInsert,
                        observations: this._itemForm.value.observations,
                        garnishFoodQuantity: this._itemForm.value.garnishFoodQuantity,
                        garnishFood: _lGarnishFoodToInsert,
                        additions: _lAdditionsToInsert,
                        has_reward: this._itemForm.value.acceptReward,
                        reward_points: rewardPointsAux
                    });
                }
                resolve(_lNewItem);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Function to change Section
     * @param {string} _section
     */
    changeSection(_section): void {
        let _establishmentSectionsIds: string[] = [];
        this._establishmentList = [];
        this._selectedSectionValue = _section;
        this._itemForm.controls['section'].setValue(_section);

        this._categories = Categories.find({ section: _section, is_active: true }).zone();
        if (this._categories.isEmpty) { this._selectedCategoryValue = ""; }
        if (this._subcategories) {
            if (this._subcategories.isEmpty) { this._selectedSubcategoryValue = ""; }
        }

        let _lSection: Section = Sections.findOne({ _id: _section });

        if (Establishments.collection.find({ _id: { $in: _lSection.establishments } }).count() > 0) {
            this._showEstablishments = true;
            Establishments.collection.find({ _id: { $in: _lSection.establishments } }).fetch().forEach((r) => {
                let control: FormControl = new FormControl(false);
                this._establishmentsFormGroup.addControl(r._id, control);
                _establishmentSectionsIds.push(r._id);
                this._establishmentList.push(r);
            });
        }

        if (GarnishFoodCol.collection.find({ 'establishments.establishment_id': { $in: _establishmentSectionsIds }, is_active: true }).count() > 0) {
            this._showGarnishFood = true;
            GarnishFoodCol.collection.find({ 'establishments.establishment_id': { $in: _establishmentSectionsIds }, is_active: true }).fetch().forEach((gar) => {
                let control: FormControl = new FormControl(false);
                this._garnishFormGroup.addControl(gar._id, control);
            });
            this._garnishFood = GarnishFoodCol.collection.find({ 'establishments.establishment_id': { $in: _establishmentSectionsIds }, is_active: true }).fetch();
        }

        if (Additions.collection.find({ 'establishments.establishment_id': { $in: _establishmentSectionsIds }, is_active: true }).count() > 0) {
            this._showAdditions = true;
            Additions.collection.find({ 'establishments.establishment_id': { $in: _establishmentSectionsIds }, is_active: true }).fetch().forEach((ad) => {
                let control: FormControl = new FormControl(false);
                this._additionsFormGroup.addControl(ad._id, control);
            });
            this._additions = Additions.collection.find({ 'establishments.establishment_id': { $in: _establishmentSectionsIds }, is_active: true }).fetch();
        }
    }

    /**
     * This function allow create item price with diferent currencies
     * @param {string} _pEstablishmentName 
     * @param {any} _pEvent 
     */
    onCheckEstablishment(_pEstablishmentName: string, _pEvent: any): void {
        let _lEstablishment: Establishment = this._establishmentList.filter(r => r.name === _pEstablishmentName)[0];
        if (_pEvent.checked) {
            this._establishmentsSelectedCount++;
            let _lCountry: Country = Countries.findOne({ _id: _lEstablishment.countryId });
            if (this._establishmentCurrencies.indexOf(_lEstablishment.currencyId) <= -1) {
                let _lCurrency: Currency = Currencies.findOne({ _id: _lEstablishment.currencyId });
                let _initValue: string = '';
                if (_lCurrency.decimal !== 0) {
                    for (let i = 0; i < (_lCurrency.decimal).toString().slice((_lCurrency.decimal.toString().indexOf('.')), (_lCurrency.decimal.toString().length)).length - 1; i++) {
                        _initValue += '0';
                    }
                    _initValue = '0.' + _initValue;
                }
                let control: FormControl = new FormControl(_initValue, [Validators.required]);
                this._currenciesFormGroup.addControl(_lEstablishment.currencyId, control);
                this._establishmentCurrencies.push(_lEstablishment.currencyId);

                if (_lCountry.itemsWithDifferentTax === true) {
                    let control: FormControl = new FormControl('0', [Validators.required]);
                    this._taxesFormGroup.addControl(_lEstablishment.currencyId, control);
                    this._establishmentTaxes.push(_lEstablishment.currencyId);
                }
            }
        } else {
            this._establishmentsSelectedCount--;
            let _aux: number = 0;
            let _auxTax: number = 0;
            let arr: any[] = Object.keys(this._itemForm.value.establishments);
            arr.forEach((est) => {
                if (this._itemForm.value.establishments[est]) {
                    let _lRes: Establishment = this._establishmentList.filter(r => r.name === est)[0];
                    if (_lEstablishment.currencyId === _lRes.currencyId) {
                        _aux++;
                    }
                    let _lCountry: Country = Countries.findOne({ _id: _lRes.countryId });
                    if (_lCountry.itemsWithDifferentTax === true) {
                        _auxTax++;
                    }
                }
            });

            if (_aux === 0) { this._establishmentCurrencies.splice(this._establishmentCurrencies.indexOf(_lEstablishment.currencyId), 1); }
            if (_auxTax === 0) { this._establishmentTaxes.splice(this._establishmentTaxes.indexOf(_lEstablishment.currencyId), 1); }
        }
        this._establishmentCurrencies.length > 0 ? this._showCurrencies = true : this._showCurrencies = false;
        this._establishmentTaxes.length > 0 ? this._showTaxes = true : this._showTaxes = false;
    }

    /**
     * Function to change category
     * @param {string} _category
     */
    changeCategory(_category): void {
        this._selectedCategoryValue = _category;
        this._itemForm.controls['category'].setValue(_category);
        this._subcategories = Subcategories.find({ category: _category, is_active: true }).zone();

        if (this._subcategories.isEmpty) { this._selectedSubcategoryValue = ""; }
    }

    /**
     * Function to change subcategory
     * @param {string} _subcategory
     */
    changeSubcategory(_subcategory): void {
        this._selectedSubcategoryValue = _subcategory;
        this._itemForm.controls['subcategory'].setValue(_subcategory);
    }

    /**
     * Function to cancel add Item
     */
    cancel(): void {
        if (this._selectedSectionValue !== "") { this._selectedSectionValue = ""; }
        if (this._selectedCategoryValue !== "") { this._selectedCategoryValue = ""; }
        if (this._selectedSubcategoryValue !== "") { this._selectedSubcategoryValue = ""; }
        this._createImage = false;
        this._itemForm.reset();
        this._router.navigate(['app/items']);
    }

    /**
     * Function to insert new image
     */
    changeImage(): void {
        this._imageService.client.pick(this._imageService.pickOptions).then((res) => {
            let _imageToUpload: any = res.filesUploaded[0];
            this._nameImageFile = _imageToUpload.filename;
            this._itemImageToInsert = _imageToUpload;
            this._createImage = true;
        }).catch((err) => {
            var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
        });
    }

    /**
     * Allow mark all garnish food
     * @param {any} _event
     */
    markAllGarnishFood(_event: any): void {
        if (_event.checked) {
            GarnishFoodCol.collection.find({}).fetch().forEach((gar) => {
                if (this._garnishFormGroup.contains(gar._id)) {
                    this._garnishFormGroup.controls[gar._id].setValue(true);
                }
            });
        } else {
            GarnishFoodCol.collection.find({}).fetch().forEach((gar) => {
                if (this._garnishFormGroup.contains(gar._id)) {
                    this._garnishFormGroup.controls[gar._id].setValue(false);
                }
            });
        }
    }

    /**
     * Allow mark all additions
     * @param {any} _event
     */
    markAllAdditions(_event: any): void {
        if (_event.checked) {
            Additions.collection.find({}).fetch().forEach((ad) => {
                if (this._additionsFormGroup.contains(ad._id)) {
                    this._additionsFormGroup.controls[ad._id].setValue(true);
                }
            });
        } else {
            Additions.collection.find({}).fetch().forEach((ad) => {
                if (this._additionsFormGroup.contains(ad._id)) {
                    this._additionsFormGroup.controls[ad._id].setValue(false);
                }
            });
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
     * This function allow translate
     * @param itemName 
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * Implements ngOnDestroy function
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}