import { Component, OnInit, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Observable, Subscription } from 'rxjs';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { GarnishFoodCol } from '../../../../../../../../both/collections/menu/garnish-food.collection';
import { GarnishFood, GarnishFoodEstablishment, GarnishFoodPrice } from '../../../../../../../../both/models/menu/garnish-food.model';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { Country } from '../../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../../both/collections/general/country.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'garnishFood-edit',
    templateUrl: './garnish-food-edit.component.html',
    styleUrls: ['./garnish-food-edit.component.scss'],
    providers: [UserLanguageService]
})
export class GarnishFoodEditComponent implements OnInit {

    private _user = Meteor.userId();
    public _garnishFoodToEdit: GarnishFood;
    private _editForm: FormGroup;
    private _currenciesFormGroup: FormGroup = new FormGroup({});
    private _taxesFormGroup: FormGroup = new FormGroup({});
    private _mdDialogRef: MatDialogRef<any>;

    private _garnishFoodCol: Observable<GarnishFood[]>;
    private _currencies: Observable<Currency[]>;
    private _establishments: Observable<Establishment[]>;

    private titleMsg: string;
    private btnAcceptLbl: string;
    private _establishmentCurrencies: string[] = [];
    private _showCurrencies: boolean = false;
    private _establishmentTaxes: string[] = [];
    private _showTaxes: boolean = false;

    /**
     * GarnishFoodEditComponent constructor
     * @param {FormBuilder} _formBuilder
     * @param {TranslateService} _translate
     * @param {MatDialogRef<any>} _dialogRef
     * @param {NgZone} _ngZone
     * @param {MatSnackBar} snackBar
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        public _dialogRef: MatDialogRef<any>,
        private _ngZone: NgZone,
        public snackBar: MatSnackBar,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * Implements ngOnInit function
     */
    ngOnInit() {
        this._editForm = this._formBuilder.group({
            editId: [this._garnishFoodToEdit._id],
            editName: [this._garnishFoodToEdit.name, Validators.required],
            editIsActive: [this._garnishFoodToEdit.is_active],
            editCurrencies: this._currenciesFormGroup,
            editTaxes: this._taxesFormGroup
        });

        this._garnishFoodCol = GarnishFoodCol.find({}).zone();
        this._establishments = Establishments.find({}).zone();
        this._establishments.subscribe(() => { this.buildControls(); });
    }

    /**
     * Function to build form controls
     */
    buildControls(): void {
        this._establishmentCurrencies = [];
        this._establishmentTaxes = [];

        if (this._garnishFoodToEdit.prices.length > 0) {
            this._showCurrencies = true;
            this._garnishFoodToEdit.prices.forEach((p) => {
                if (this._currenciesFormGroup.contains(p.currencyId)) {
                    this._currenciesFormGroup.controls[p.currencyId].setValue(p.price);
                } else {
                    let control: FormControl = new FormControl(p.price, [Validators.required]);
                    this._currenciesFormGroup.addControl(p.currencyId, control);
                }
                this._establishmentCurrencies.push(p.currencyId);

                if (p.garnishFoodTax !== undefined) {
                    this._showTaxes = true;
                    if (this._taxesFormGroup.contains(p.currencyId)) {
                        this._taxesFormGroup.controls[p.currencyId].setValue(p.garnishFoodTax);
                    } else {
                        let controlTax: FormControl = new FormControl(p.garnishFoodTax, [Validators.required]);
                        this._taxesFormGroup.addControl(p.currencyId, controlTax);
                    }
                    this._establishmentTaxes.push(p.currencyId);
                }
            });
        }

        Establishments.collection.find({}).fetch().forEach((establishment) => {
            let _lCountry: Country = Countries.findOne({ _id: establishment.countryId });
            if (this._establishmentCurrencies.indexOf(establishment.currencyId) <= -1) {
                let _lCurrency: Currency = Currencies.findOne({ _id: establishment.currencyId });
                let _initValue: string = '';
                if (_lCurrency.decimal !== 0) {
                    for (let i = 0; i < (_lCurrency.decimal).toString().slice((_lCurrency.decimal.toString().indexOf('.')), (_lCurrency.decimal.toString().length)).length - 1; i++) {
                        _initValue += '0';
                    }
                    _initValue = '.' + _initValue;
                } else {
                    _initValue = '0';
                }
                if (this._currenciesFormGroup.contains(establishment.currencyId)) {
                    this._currenciesFormGroup.controls[establishment.currencyId].setValue(_initValue);
                } else {
                    let control: FormControl = new FormControl(_initValue, [Validators.required]);
                    this._currenciesFormGroup.addControl(establishment.currencyId, control);
                }
                this._establishmentCurrencies.push(establishment.currencyId);

                if (_lCountry.itemsWithDifferentTax === true) {
                    if (this._taxesFormGroup.contains(establishment.currencyId)) {
                        this._taxesFormGroup.controls[establishment.currencyId].setValue('');
                    } else {
                        let control: FormControl = new FormControl('0', [Validators.required]);
                        this._taxesFormGroup.addControl(establishment.currencyId, control);
                    }
                    this._establishmentTaxes.push(establishment.currencyId);
                }
            }
        });
        this._establishmentCurrencies.length > 0 ? this._showCurrencies = true : this._showCurrencies = false;
        this._establishmentTaxes.length > 0 ? this._showTaxes = true : this._showTaxes = false;
        this._currencies = Currencies.find({}).zone();
    }

    /**
     * Function to edit Garnish Food
     */
    editGarnishFood(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._editForm.valid) {
            let arrCur: any[] = Object.keys(this._editForm.value.editCurrencies);
            let _lGarnishFoodEstablishmentsToInsert: GarnishFoodEstablishment[] = [];
            let _lGarnishFoodPricesToInsert: GarnishFoodPrice[] = [];

            arrCur.forEach((cur) => {
                let find: Establishment[] = Establishments.collection.find({}).fetch().filter(r => r.currencyId === cur);
                for (let res of find) {
                    let _lGarnishFoodEstablishment: GarnishFoodEstablishment = { establishment_id: '', price: 0 };
                    _lGarnishFoodEstablishment.establishment_id = res._id;
                    _lGarnishFoodEstablishment.price = this._editForm.value.editCurrencies[cur];

                    if (this._editForm.value.editTaxes[cur] !== undefined) {
                        _lGarnishFoodEstablishment.garnishFoodTax = this._editForm.value.editTaxes[cur];
                    }

                    _lGarnishFoodEstablishmentsToInsert.push(_lGarnishFoodEstablishment);
                }
                let _lGarnishFoodPrice: GarnishFoodPrice = { currencyId: '', price: 0 };
                _lGarnishFoodPrice.currencyId = cur;
                _lGarnishFoodPrice.price = this._editForm.value.editCurrencies[cur];
                if (this._editForm.value.editTaxes[cur] !== undefined) {
                    _lGarnishFoodPrice.garnishFoodTax = this._editForm.value.editTaxes[cur];
                }
                _lGarnishFoodPricesToInsert.push(_lGarnishFoodPrice);
            });

            GarnishFoodCol.update(this._editForm.value.editId, {
                $set: {
                    modification_user: this._user,
                    modification_date: new Date(),
                    name: this._editForm.value.editName,
                    is_active: this._editForm.value.editIsActive,
                    establishments: _lGarnishFoodEstablishmentsToInsert,
                    prices: _lGarnishFoodPricesToInsert
                }
            });

            let _lMessage: string = this.itemNameTraduction('GARNISHFOOD.GARNISH_FOOD_EDITED');
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
}