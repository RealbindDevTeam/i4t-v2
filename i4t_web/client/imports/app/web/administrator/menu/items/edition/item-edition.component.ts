import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Item, ItemImage, ItemEstablishment, ItemPrice } from '../../../../../../../../both/models/menu/item.model';
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
    selector: 'item-edition',
    templateUrl: './item-edition.component.html',
    styleUrls: ['./item-edition.component.scss'],
    providers: [UserLanguageService, ImageService]
})
export class ItemEditionComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    public _itemToEdit: Item;
    private _itemEditionForm: FormGroup;
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
    private _garnishFoodSub: Subscription;
    private _additionSub: Subscription;
    private _currenciesSub: Subscription;
    private _countriesSub: Subscription;

    public _selectedIndex: number = 0;
    private _showGarnishFood: boolean = true;
    private _showAddition: boolean = true;
    private _garnishFoodQuantity: number = 0;
    private _showEstablishments: boolean = false;
    private _showCurrencies: boolean = false;
    private _showTaxes: boolean = false;

    private _itemSection: string;
    private _itemCategory: string;
    private _itemSubcategory: string;
    private _selectedCategory: string = "";
    private _selectedSection: string = "";
    private _selectedSubcategory: string = "";
    private _selectedTime: string;

    private _garnishFoodList: GarnishFood[];
    private _itemGarnishFood: string[];
    private _edition_garnishFood: string[];
    private _itemAdditions: string[];
    private _additionList: Addition[];
    private _edition_addition: string[];
    private _establishmentList: Establishment[] = [];
    private _itemEstablishments: ItemEstablishment[] = [];
    private _establishmentCurrencies: string[] = [];
    private _establishmentTaxes: string[] = [];

    private _editImage: boolean = false;
    private _editItemImageToInsert: ItemImage;
    private _nameImageFileEdit: string;
    private _itemEditImageUrl: string;
    private _establishmentsSelectedCount: number = 0;
    private titleMsg: string;
    private btnAcceptLbl: string;

    private _rewardEnable: boolean = false;
    private _rewardPointsArray: any[];
    private _cookingTimeArray: any[];
    private _selectedPoints: string;

    /**
     * ItemEditionComponent constructor
     * @param {FormBuilder} _formBuilder
     * @param {TranslateService} _translate
     * @param {NgZone} _ngZone
     * @param {MatDialogRef<any>} _dialogRef
     * @param {MatSnackBar} snackBar
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        public _dialogRef: MatDialogRef<any>,
        public snackBar: MatSnackBar,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog,
        private _imageService: ImageService) {
        let _lng: string = this._userLanguageService.getLanguage(Meteor.user());
        _translate.use(_lng);
        _translate.setDefaultLang('en');
        this._itemGarnishFood = [];
        this._garnishFoodList = [];
        this._edition_garnishFood = [];
        this._itemAdditions = [];
        this._additionList = [];
        this._edition_addition = [];
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * implements ngOnInit function
     */
    ngOnInit() {
        this.removeSubscriptions();
        let _establishmentsId: string[] = [];
        let _currenciesId: string[] = [];
        this._itemEditionForm = this._formBuilder.group({
            editId: [this._itemToEdit._id],
            editIsActive: [this._itemToEdit.is_active],
            editSectionId: [this._itemToEdit.sectionId],
            editCategoryId: [this._itemToEdit.categoryId],
            editSubcategoryId: [this._itemToEdit.subcategoryId],
            editName: [this._itemToEdit.name],
            editDescription: [this._itemToEdit.description],
            editCookingTime: [this._itemToEdit.time],
            editEstablishments: this._establishmentsFormGroup,
            editCurrencies: this._currenciesFormGroup,
            editTaxes: this._taxesFormGroup,
            editObservations: [this._itemToEdit.observations],
            editImage: [''],
            editGarnishFoodQuantity: [this._itemToEdit.garnishFoodQuantity],
            editGarnishFood: this._garnishFormGroup,
            editAdditions: this._additionsFormGroup,
            editAcceptReward: [this._itemToEdit.has_reward],
            editRewardValue: [this._itemToEdit.reward_points]
        });

        this._itemSection = this._itemToEdit.sectionId;
        this._selectedSection = this._itemToEdit.sectionId;
        this._itemCategory = this._itemToEdit.categoryId;
        this._selectedCategory = this._itemToEdit.categoryId;
        this._itemSubcategory = this._itemToEdit.subcategoryId;
        this._selectedSubcategory = this._itemToEdit.subcategoryId;
        this._selectedTime = this._itemToEdit.time;

        this._itemGarnishFood = this._itemToEdit.garnishFood;
        this._itemAdditions = this._itemToEdit.additions;
        this._garnishFoodQuantity = this._itemToEdit.garnishFoodQuantity;
        this._itemEstablishments = this._itemToEdit.establishments;

        this._rewardEnable = this._itemToEdit.has_reward;
        this._selectedPoints = this._itemToEdit.reward_points;

        this._establishmentsSelectedCount = this._itemToEdit.establishments.length;
        if (this._itemToEdit.establishments.length > 0) { this._showEstablishments = true }

        this._itemsSub = MeteorObservable.subscribe('items', this._user).subscribe(() => {
            this._ngZone.run(() => {
                let _itemImg: ItemImage = Items.findOne({ _id: this._itemToEdit._id }).image;
                if (_itemImg) {
                    this._itemEditImageUrl = _itemImg.url;
                } else {
                    this._itemEditImageUrl = '/images/default-plate.png';
                }
            });
        });

        this._sectionsSub = MeteorObservable.subscribe('sections', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._sections = Sections.find({ is_active: true }).zone();
                let _lSection: Section = Sections.findOne({ _id: this._itemToEdit.sectionId })
                Establishments.collection.find({ _id: { $in: _lSection.establishments } }).fetch().forEach((r) => {
                    _establishmentsId.push(r._id);
                    _currenciesId.push(r.currencyId);

                    let find = this._itemEstablishments.filter(est => r._id === est.establishment_id);

                    if (find.length > 0) {
                        let control: FormControl = new FormControl(true);
                        this._establishmentsFormGroup.addControl(r._id, control);
                        this._establishmentList.push(r);
                    } else {
                        let control: FormControl = new FormControl(false);
                        this._establishmentsFormGroup.addControl(r._id, control);
                        this._establishmentList.push(r);
                    }
                });
                this._countriesSub = MeteorObservable.subscribe('getCountriesByEstablishmentsId', _establishmentsId).subscribe();
                this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', _establishmentsId).subscribe(() => {
                    this._ngZone.run(() => {
                        if (this._itemToEdit.prices.length > 0) {
                            this._showCurrencies = true;
                            this._itemToEdit.prices.forEach((p) => {
                                let control: FormControl = new FormControl(p.price, [Validators.required]);
                                this._currenciesFormGroup.addControl(p.currencyId, control);
                                this._establishmentCurrencies.push(p.currencyId);

                                if (p.itemTax !== undefined) {
                                    this._showTaxes = true;
                                    let controlTax: FormControl = new FormControl(p.itemTax, [Validators.required]);
                                    this._taxesFormGroup.addControl(p.currencyId, controlTax);
                                    this._establishmentTaxes.push(p.currencyId);
                                }
                            });
                        }
                        this._currencies = Currencies.find({ _id: { $in: _currenciesId } }).zone();
                    });
                });
            });
        });

        this._categorySub = MeteorObservable.subscribe('categories', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._categories = Categories.find({ section: this._itemSection }).zone();
            });
        });

        this._subcategorySub = MeteorObservable.subscribe('subcategories', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._subcategories = Subcategories.find({ category: this._itemCategory }).zone();
            });
        });

        this._garnishFoodSub = MeteorObservable.subscribe('garnishFood', this._user).subscribe(() => {
            this._ngZone.run(() => {
                GarnishFoodCol.collection.find().fetch().forEach((gar) => {
                    let garnishF: GarnishFood = gar;
                    let find = this._itemGarnishFood.filter(g => g == garnishF._id);

                    if (find.length > 0) {
                        let control: FormControl = new FormControl(true);
                        this._garnishFormGroup.addControl(garnishF._id, control);
                        this._garnishFoodList.push(garnishF);
                    } else {
                        let control: FormControl = new FormControl(false);
                        this._garnishFormGroup.addControl(garnishF._id, control);
                        this._garnishFoodList.push(garnishF);
                    }
                });

                if (this._garnishFoodList.length === 0) { this._showGarnishFood = false; }
            });
        });
        this._additionSub = MeteorObservable.subscribe('additions', this._user).subscribe(() => {
            this._ngZone.run(() => {
                Additions.collection.find().fetch().forEach((add) => {
                    let addition: Addition = add;
                    let findAdd = this._itemAdditions.filter(d => d == addition._id);

                    if (findAdd.length > 0) {
                        let control: FormControl = new FormControl(true);
                        this._additionsFormGroup.addControl(addition._id, control);
                        this._additionList.push(addition);
                    } else {
                        let control: FormControl = new FormControl(false);
                        this._additionsFormGroup.addControl(addition._id, control);
                        this._additionList.push(addition);
                    }
                });

                if (this._additionList.length === 0) { this._showAddition = false; }
            });
        });

        this._cookingTimeArray = [{ value: "5 min aprox", label: "5 min aprox" }, { value: "15 min aprox", label: "15 min aprox" },
        { value: "30 min aprox", label: "30 min aprox" }, { value: "45 min aprox", label: "45 min aprox" },
        { value: "1 h aprox", label: "1 h aprox" }, { value: "1 h 15 min aprox", label: "1 h 15 min aprox" },
        { value: "1 h 30 min aprox", label: "1 h 30 min aprox" }, { value: "1 h 45 min aprox", label: "1 h 45 min aprox" },
        { value: "2 h aprox", label: "2 h aprox" }, { value: "+ 2 h aprox", label: "+ 2 h aprox" }];

        this._rewardPointsArray = [{ value: "5", label: "5 pts" }, { value: "10", label: "10 pts" }, { value: "15", label: "15 pts" },
        { value: "20", label: "20 pts" }, { value: "25", label: "25 pts" }, { value: "30", label: "30 pts" }, { value: "35", label: "35 pts" },
        { value: "40", label: "40 pts" }, { value: "45", label: "45 pts" }, { value: "50", label: "50 pts" }, { value: "55", label: "55 pts" },
        { value: "60", label: "60 pts" }, { value: "65", label: "65 pts" }, { value: "70", label: "70 pts" }, { value: "75", label: "75 pts" },
        { value: "80", label: "80 pts" }, { value: "85", label: "85 pts" }, { value: "90", label: "90 pts" }, { value: "95", label: "95 pts" },
        { value: "100", label: "100 pts" }];
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._itemsSub) { this._itemsSub.unsubscribe(); }
        if (this._sectionsSub) { this._sectionsSub.unsubscribe(); }
        if (this._categorySub) { this._categorySub.unsubscribe(); }
        if (this._subcategorySub) { this._subcategorySub.unsubscribe(); }
        if (this._garnishFoodSub) { this._garnishFoodSub.unsubscribe(); }
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
                if (this._itemEditionForm.controls['editSectionId'].valid) {
                    return true;
                } else {
                    return false;
                }
            case 2:
                if (this._itemEditionForm.controls['editName'].valid && this._establishmentsSelectedCount > 0) {
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
     * This fuction allow wizard to create establishment
     */
    canFinish(): boolean {
        return this._itemEditionForm.valid;
    }

    /**
     * Function to change Section
     * @param {string} _section
     */
    changeSectionEdit(_section): void {
        let _estabishmentSectionsIds: string[] = [];
        this._establishmentList = [];
        this._establishmentCurrencies = [];
        this._establishmentTaxes = [];
        this._itemEditionForm.controls['editSectionId'].setValue(_section);

        this._categories = Categories.find({ section: _section, is_active: true }).zone();
        if (this._categories.isEmpty) { this._selectedCategory = ""; }

        let _lSection: Section = Sections.findOne({ _id: _section });

        if (_section !== this._itemToEdit.sectionId) {
            this._establishmentsSelectedCount = 0;
            this._showCurrencies = false;
            this._itemEditionForm.controls['editGarnishFoodQuantity'].setValue('0');

            if (Establishments.collection.find({ _id: { $in: _lSection.establishments } }).count() > 0) {
                this._showEstablishments = true;
                Establishments.collection.find({ _id: { $in: _lSection.establishments } }).fetch().forEach((r) => {
                    if (this._establishmentsFormGroup.contains(r._id)) {
                        this._establishmentsFormGroup.controls[r._id].setValue(false);
                    } else {
                        let control: FormControl = new FormControl(false);
                        this._establishmentsFormGroup.addControl(r._id, control);
                    }

                    _estabishmentSectionsIds.push(r._id);
                    this._establishmentList.push(r);

                    if (this._currenciesFormGroup.contains(r.currencyId)) {
                        this._currenciesFormGroup.controls[r.currencyId].setValue('0');
                    } else {
                        let control: FormControl = new FormControl('0', [Validators.required]);
                        this._currenciesFormGroup.addControl(r.currencyId, control);
                    }

                    let _lCurrency = this._establishmentCurrencies.filter(cur => cur === r.currencyId);
                    if (_lCurrency.length === 0) {
                        this._establishmentCurrencies.push(r.currencyId);
                    }

                    let _lCountry: Country = Countries.findOne({ _id: r.countryId });
                    if (_lCountry.itemsWithDifferentTax === true) {
                        this._showTaxes = true;
                        if (this._taxesFormGroup.contains(r.currencyId)) {
                            this._taxesFormGroup.controls[r.currencyId].setValue('0');
                        } else {
                            let controlTax: FormControl = new FormControl('0', [Validators.required]);
                            this._taxesFormGroup.addControl(r.currencyId, controlTax);
                        }
                        let _lTax = this._establishmentTaxes.filter(tax => tax === r.currencyId);
                        if (_lTax.length === 0) {
                            this._establishmentTaxes.push(r.currencyId);
                        }
                    }
                });
            }

            if (GarnishFoodCol.collection.find({ 'establishments.establishment_id': { $in: _estabishmentSectionsIds } }).count() > 0) {
                this._showGarnishFood = true;
                GarnishFoodCol.collection.find({ 'establishments.establishment_id': { $in: _estabishmentSectionsIds } }).fetch().forEach((gar) => {
                    if (this._garnishFormGroup.contains(gar._id)) {
                        this._garnishFormGroup.controls[gar._id].setValue(false);
                    } else {
                        let control: FormControl = new FormControl(false);
                        this._garnishFormGroup.addControl(gar._id, control);
                    }
                });
                this._garnishFoodList = GarnishFoodCol.collection.find({ 'establishments.establishment_id': { $in: _estabishmentSectionsIds } }).fetch();
            } else {
                this._showGarnishFood = false;
            }

            if (Additions.collection.find({ 'establishments.establishment_id': { $in: _estabishmentSectionsIds } }).count() > 0) {
                this._showAddition = true;
                Additions.collection.find({ 'establishments.establishment_id': { $in: _estabishmentSectionsIds } }).fetch().forEach((ad) => {
                    if (this._additionsFormGroup.contains(ad._id)) {
                        this._additionsFormGroup.controls[ad._id].setValue(false);
                    } else {
                        let control: FormControl = new FormControl(false);
                        this._additionsFormGroup.addControl(ad._id, control);
                    }
                });
                this._additionList = Additions.collection.find({ 'establishments.establishment_id': { $in: _estabishmentSectionsIds } }).fetch();
            } else {
                this._showAddition = false;
            }
        } else {
            this._establishmentsSelectedCount = this._itemToEdit.establishments.length;
            this._itemEditionForm.controls['editGarnishFoodQuantity'].setValue(this._itemToEdit.garnishFoodQuantity);
            if (Establishments.collection.find({ _id: { $in: _lSection.establishments } }).count() > 0) {
                this._showEstablishments = true;
                Establishments.collection.find({ _id: { $in: _lSection.establishments } }).fetch().forEach((r) => {

                    let find = this._itemEstablishments.filter(est => r._id === est.establishment_id);

                    if (find.length > 0) {
                        if (this._establishmentsFormGroup.contains(r._id)) {
                            this._establishmentsFormGroup.controls[r._id].setValue(true);
                        } else {
                            let control: FormControl = new FormControl(true);
                            this._establishmentsFormGroup.addControl(r._id, control);
                        }
                    } else {
                        if (this._establishmentsFormGroup.contains(r._id)) {
                            this._establishmentsFormGroup.controls[r._id].setValue(false);
                        } else {
                            let control: FormControl = new FormControl(false);
                            this._establishmentsFormGroup.addControl(r._id, control);
                        }
                    }
                    _estabishmentSectionsIds.push(r._id);
                    this._establishmentList.push(r);
                });

                if (this._itemToEdit.prices.length > 0) {
                    this._showCurrencies = true;
                    this._itemToEdit.prices.forEach((p) => {
                        if (this._currenciesFormGroup.contains(p.currencyId)) {
                            this._currenciesFormGroup.controls[p.currencyId].setValue(p.price);
                        } else {
                            let control: FormControl = new FormControl(p.price, [Validators.required]);
                            this._currenciesFormGroup.addControl(p.currencyId, control);
                        }
                        this._establishmentCurrencies.push(p.currencyId);
                        if (p.itemTax !== undefined) {
                            this._showTaxes = true;
                            if (this._taxesFormGroup.contains(p.currencyId)) {
                                this._taxesFormGroup.controls[p.currencyId].setValue(p.itemTax);
                            } else {
                                let controlTax: FormControl = new FormControl(p.itemTax, [Validators.required]);
                                this._taxesFormGroup.addControl(p.currencyId, controlTax);
                            }
                            this._establishmentTaxes.push(p.currencyId);
                        }
                    });
                }
            }

            if (GarnishFoodCol.collection.find({ 'establishments.establishment_id': { $in: _estabishmentSectionsIds } }).count() > 0) {
                this._showGarnishFood = true;
                GarnishFoodCol.collection.find({ 'establishments.establishment_id': { $in: _estabishmentSectionsIds } }).fetch().forEach((gar) => {
                    let garnishF: GarnishFood = gar;
                    let find = this._itemGarnishFood.filter(g => g == garnishF._id);

                    if (find.length > 0) {
                        if (this._garnishFormGroup.contains(gar._id)) {
                            this._garnishFormGroup.controls[gar._id].setValue(true);
                        } else {
                            let control: FormControl = new FormControl(true);
                            this._garnishFormGroup.addControl(gar._id, control);
                        }
                    } else {
                        if (this._garnishFormGroup.contains(gar._id)) {
                            this._garnishFormGroup.controls[gar._id].setValue(false);
                        } else {
                            let control: FormControl = new FormControl(false);
                            this._garnishFormGroup.addControl(gar._id, control);
                        }
                    }
                });
                this._garnishFoodList = GarnishFoodCol.collection.find({ 'establishments.establishment_id': { $in: _estabishmentSectionsIds } }).fetch();
            } else {
                this._showGarnishFood = false;
            }

            if (Additions.collection.find({ 'establishments.establishment_id': { $in: _estabishmentSectionsIds } }).count() > 0) {
                this._showAddition = true;
                Additions.collection.find({ 'establishments.establishment_id': { $in: _estabishmentSectionsIds } }).fetch().forEach((add) => {
                    let addition: Addition = add;
                    let findAdd = this._itemAdditions.filter(d => d == addition._id);

                    if (findAdd.length > 0) {
                        if (this._additionsFormGroup.contains(add._id)) {
                            this._additionsFormGroup.controls[add._id].setValue(true);
                        } else {
                            let control: FormControl = new FormControl(true);
                            this._additionsFormGroup.addControl(add._id, control);
                        }
                    } else {
                        if (this._additionsFormGroup.contains(add._id)) {
                            this._additionsFormGroup.controls[add._id].setValue(false);
                        } else {
                            let control: FormControl = new FormControl(false);
                            this._additionsFormGroup.addControl(add._id, control);
                        }
                    }
                });
                this._additionList = Additions.collection.find({ 'establishments.establishment_id': { $in: _estabishmentSectionsIds } }).fetch();
            } else {
                this._showAddition = false;
            }
        }
    }

    /**
     * Function to change category
     * @param {string} _category
     */
    changeCategoryEdit(_category) {
        this._itemEditionForm.controls['editCategoryId'].setValue(_category);
        this._subcategories = Subcategories.find({ category: _category, is_active: true }).zone();
        if (this._subcategories.isEmpty) { this._selectedSubcategory = ""; }
    }

    /**
     * Function to change subcategory
     * @param {string} _subcategory
     */
    changeSubcategoryEdit(_subcategory) {
        this._itemEditionForm.controls['editSubcategoryId'].setValue(_subcategory);
    }

    /**
     * Function to insert new image
     */
    changeImage(): void {
        this._imageService.client.pick(this._imageService.pickOptions).then((res) => {
            let _imageToUpload: any = res.filesUploaded[0];
            this._nameImageFileEdit = _imageToUpload.filename;
            this._editItemImageToInsert = _imageToUpload;
            this._editImage = true;
        }).catch((err) => {
            var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
        });
    }

    /**
     * Function to edit Item
     */
    editItem(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._itemEditionForm.valid) {
            let arrCur: any[] = Object.keys(this._itemEditionForm.value.editCurrencies);
            let _lItemEstablishmentsToInsert: ItemEstablishment[] = [];
            let _lItemPricesToInsert: ItemPrice[] = [];

            arrCur.forEach((cur) => {
                let find: Establishment[] = this._establishmentList.filter(r => r.currencyId === cur);
                for (let res of find) {
                    if (this._itemEditionForm.value.editEstablishments[res._id]) {
                        let _lItemEstablishment: ItemEstablishment = { establishment_id: '', price: 0, isAvailable: true };
                        _lItemEstablishment.establishment_id = res._id;
                        _lItemEstablishment.price = this._itemEditionForm.value.editCurrencies[cur];

                        if (this._itemEditionForm.value.editTaxes[cur] !== undefined) {
                            _lItemEstablishment.itemTax = this._itemEditionForm.value.editTaxes[cur];
                        }

                        _lItemEstablishmentsToInsert.push(_lItemEstablishment);
                    }
                }
                if (cur !== null && this._itemEditionForm.value.editCurrencies[cur] !== null) {
                    let _lItemPrice: ItemPrice = { currencyId: '', price: 0 };
                    _lItemPrice.currencyId = cur;
                    _lItemPrice.price = this._itemEditionForm.value.editCurrencies[cur];
                    if (this._itemEditionForm.value.editTaxes[cur] !== undefined) {
                        _lItemPrice.itemTax = this._itemEditionForm.value.editTaxes[cur];
                    }
                    _lItemPricesToInsert.push(_lItemPrice);
                }
            });

            let arr: any[] = Object.keys(this._itemEditionForm.value.editGarnishFood);

            arr.forEach((gar) => {
                if (this._itemEditionForm.value.editGarnishFood[gar]) {
                    this._edition_garnishFood.push(gar);
                }
            });

            let arrAdd: any[] = Object.keys(this._itemEditionForm.value.editAdditions);
            arrAdd.forEach((add) => {
                if (this._itemEditionForm.value.editAdditions[add]) {
                    this._edition_addition.push(add);
                }
            });

            let rewardPointsAux: string;
            if (this._itemEditionForm.value.editAcceptReward) {
                rewardPointsAux = this._itemEditionForm.value.editRewardValue
            } else {
                rewardPointsAux = "0";
            }

            if (this._editImage) {
                /* let _lItemImage: ItemImage = Items.findOne({ _id: this._itemToEdit._id }).image;
                if (_lItemImage) {
                    this._imageService.client.remove(_lItemImage.handle).then((res) => {
                        console.log(res);
                    }).catch((err) => {
                        var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
                        this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
                    });
                }*/
                Items.update(this._itemEditionForm.value.editId, {
                    $set: {
                        modification_user: this._user,
                        modification_date: new Date(),
                        is_active: this._itemEditionForm.value.editIsActive,
                        sectionId: this._itemEditionForm.value.editSectionId,
                        categoryId: this._itemEditionForm.value.editCategoryId,
                        subcategoryId: this._itemEditionForm.value.editSubcategoryId,
                        name: this._itemEditionForm.value.editName,
                        description: this._itemEditionForm.value.editDescription,
                        time: this._itemEditionForm.value.editCookingTime,
                        establishments: _lItemEstablishmentsToInsert,
                        prices: _lItemPricesToInsert,
                        observations: this._itemEditionForm.value.editObservations,
                        image: this._editItemImageToInsert,
                        garnishFoodQuantity: this._itemEditionForm.value.editGarnishFoodQuantity,
                        garnishFood: this._edition_garnishFood,
                        additions: this._edition_addition,
                        isAvailable: this._itemEditionForm.value.editIsAvailable,
                        has_reward: this._itemEditionForm.value.editAcceptReward,
                        reward_points: rewardPointsAux
                    }
                });
            } else {
                Items.update(this._itemEditionForm.value.editId, {
                    $set: {
                        modification_user: this._user,
                        modification_date: new Date(),
                        is_active: this._itemEditionForm.value.editIsActive,
                        sectionId: this._itemEditionForm.value.editSectionId,
                        categoryId: this._itemEditionForm.value.editCategoryId,
                        subcategoryId: this._itemEditionForm.value.editSubcategoryId,
                        name: this._itemEditionForm.value.editName,
                        description: this._itemEditionForm.value.editDescription,
                        time: this._itemEditionForm.value.editCookingTime,
                        establishments: _lItemEstablishmentsToInsert,
                        prices: _lItemPricesToInsert,
                        observations: this._itemEditionForm.value.editObservations,
                        garnishFoodQuantity: this._itemEditionForm.value.editGarnishFoodQuantity,
                        garnishFood: this._edition_garnishFood,
                        additions: this._edition_addition,
                        isAvailable: this._itemEditionForm.value.editIsAvailable,
                        has_reward: this._itemEditionForm.value.editAcceptReward,
                        reward_points: rewardPointsAux
                    }
                });
            }

            let _lMessage: string = this.itemNameTraduction('ITEMS.ITEM_EDITED');
            this.snackBar.open(_lMessage, '', {
                duration: 2500
            });
            this._dialogRef.close();
        }
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
                if (this._currenciesFormGroup.contains(_lEstablishment.currencyId)) {
                    this._currenciesFormGroup.controls[_lEstablishment.currencyId].setValue(_initValue);
                } else {
                    let control: FormControl = new FormControl(_initValue, [Validators.required]);
                    this._currenciesFormGroup.addControl(_lEstablishment.currencyId, control);
                }
                this._establishmentCurrencies.push(_lEstablishment.currencyId);

                if (_lCountry.itemsWithDifferentTax === true) {
                    if (this._taxesFormGroup.contains(_lEstablishment.currencyId)) {
                        this._taxesFormGroup.controls[_lEstablishment.currencyId].setValue('0');
                    } else {
                        let control: FormControl = new FormControl('0', [Validators.required]);
                        this._taxesFormGroup.addControl(_lEstablishment.currencyId, control);
                    }
                    this._establishmentTaxes.push(_lEstablishment.currencyId);
                }
            }
        } else {
            this._establishmentsSelectedCount--;
            let _aux: number = 0;
            let _auxTax: number = 0;
            let arr: any[] = Object.keys(this._itemEditionForm.value.editEstablishments);
            arr.forEach((rest) => {
                if (this._itemEditionForm.value.editEstablishments[rest]) {
                    let _lRes: Establishment = this._establishmentList.filter(r => r._id === rest)[0];
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
     * Implements ngOnDestroy function
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}