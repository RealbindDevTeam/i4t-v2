import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatDialogRef, MatDialog, MatSnackBar } from '@angular/material';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Restaurants, RestaurantsLegality } from '../../../../../../../../both/collections/restaurant/restaurant.collection';
import { Restaurant, RestaurantLegality, RestaurantImage } from '../../../../../../../../both/models/restaurant/restaurant.model';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { PaymentMethod } from '../../../../../../../../both/models/general/paymentMethod.model';
import { PaymentMethods } from '../../../../../../../../both/collections/general/paymentMethod.collection';
import { Countries } from '../../../../../../../../both/collections/general/country.collection';
import { Country } from '../../../../../../../../both/models/general/country.model';
import { City } from '../../../../../../../../both/models/general/city.model';
import { Cities } from '../../../../../../../../both/collections/general/city.collection';
import { createRestaurantCode, generateQRCode, createTableCode } from '../../../../../../../../both/methods/restaurant/restaurant.methods';
import { CreateConfirmComponent } from './create-confirm/create-confirm.component';
import { Table } from '../../../../../../../../both/models/restaurant/table.model';
import { Tables } from '../../../../../../../../both/collections/restaurant/table.collection';
import { PaymentsHistory } from '../../../../../../../../both/collections/payment/payment-history.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';
import { ImageService } from '../../../../services/general/image.service';
import { Addition, AdditionPrice, AdditionRestaurant } from '../../../../../../../../both/models/menu/addition.model';
import { GarnishFood, GarnishFoodPrice, GarnishFoodRestaurant } from '../../../../../../../../both/models/menu/garnish-food.model';
import { Additions } from '../../../../../../../../both/collections/menu/addition.collection';
import { GarnishFoodCol } from '../../../../../../../../both/collections/menu/garnish-food.collection';

import * as QRious from 'qrious';

@Component({
    selector: 'restaurant-register',
    templateUrl: './restaurant-register.component.html',
    styleUrls: ['./restaurant-register.component.scss']
})
export class RestaurantRegisterComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _restaurantForm: FormGroup;
    private _paymentsFormGroup: FormGroup = new FormGroup({});

    private _restaurantSub: Subscription;
    private _currencySub: Subscription;
    private _countriesSub: Subscription;
    private _citiesSub: Subscription;
    private _paymentMethodsSub: Subscription;
    private _additionsSub: Subscription;
    private _garnishFoodSub: Subscription;

    private _countries: Observable<Country[]>;
    private _cities: Observable<City[]>;
    private _paymentMethods: Observable<PaymentMethod[]>;

    private _restaurantImageToInsert: RestaurantImage;
    private _createImage: boolean;
    private _nameImageFile: string;
    public _selectedIndex: number = 0;

    private _queues: string[] = [];
    private _selectedCountryValue: string;
    private _selectedCityValue: string;
    private _restaurantCurrency: string = '';
    private _countryIndicative: string;
    private _restaurantCurrencyId: string = '';

    private restaurantCode: string = '';

    private _loading: boolean;
    private _showMessage: boolean = false;
    private _mdDialogRef: MatDialogRef<any>;
    private _currentDate: Date;
    private _firstMonthDay: Date;
    private _lastMonthDay: Date;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _restaurantLegality: RestaurantLegality;
    private _tipValue: number = 0;

    private max_table_number: number;

    /**
     * RestaurantRegisterComponent constructor
     * @param {FormBuilder} _formBuilder
     * @param {TranslateService} _translate
     * @param {NgZone} _ngZone
     * @param {Router} _router
     * @param {MatDialog} _mdDialog
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        private _router: Router,
        public _mdDialog: MatDialog,
        private _userLanguageService: UserLanguageService,
        private _imageService: ImageService,
        private _snackBar: MatSnackBar) {
        let _lng: string = this._userLanguageService.getLanguage(Meteor.user());
        _translate.use(_lng);
        _translate.setDefaultLang('en');
        this._imageService.setPickOptionsLang(_lng);
        this._selectedCountryValue = "";
        this._selectedCityValue = "";
        this._nameImageFile = "";
        this._createImage = false;
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * Implements ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._restaurantForm = new FormGroup({
            country: new FormControl('', [Validators.required]),
            city: new FormControl('', [Validators.required]),
            name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(70)]),
            address: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(90)]),
            phone: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(30)]),
            tables_number: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(3)]),
            image: new FormControl(''),
            paymentMethods: this._paymentsFormGroup,
            otherCity: new FormControl()
        });

        this._paymentMethodsSub = MeteorObservable.subscribe('paymentMethods').subscribe(() => {
            this._ngZone.run(() => {
                this._paymentMethods = PaymentMethods.find({}).zone();
                this._paymentMethods.subscribe(() => { this.createPaymentMethods() });
            });
        });

        this._restaurantSub = MeteorObservable.subscribe('restaurants', this._user).subscribe();
        this._countriesSub = MeteorObservable.subscribe('countries').subscribe(() => {
            this._ngZone.run(() => {
                this._countries = Countries.find({}).zone();
            });
        });
        this._citiesSub = MeteorObservable.subscribe('cities').subscribe();
        this._currencySub = MeteorObservable.subscribe('currencies').subscribe();
        this._additionsSub = MeteorObservable.subscribe('additions', this._user).subscribe();
        this._garnishFoodSub = MeteorObservable.subscribe('garnishFood', this._user).subscribe();
        this._currentDate = new Date();
        this._firstMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth(), 1);
        this._lastMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth() + 1, 0);

        this._restaurantForm.get('tables_number').disable();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._restaurantSub) { this._restaurantSub.unsubscribe(); }
        if (this._countriesSub) { this._countriesSub.unsubscribe(); }
        if (this._citiesSub) { this._citiesSub.unsubscribe(); }
        if (this._currencySub) { this._currencySub.unsubscribe(); }
        if (this._paymentMethodsSub) { this._paymentMethodsSub.unsubscribe(); }
        if (this._additionsSub) { this._additionsSub.unsubscribe(); }
        if (this._garnishFoodSub) { this._garnishFoodSub.unsubscribe(); }
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
     * This fuction allow wizard to create restaurant
     */
    canFinish(): boolean {
        return this._restaurantForm.valid;
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
                let arrPay: any[] = Object.keys(this._restaurantForm.value.paymentMethods);
                let _lPaymentMethods: string[] = [];
                let _validNumber: boolean;

                if (this._restaurantForm.value.tables_number <= this.max_table_number) {
                    _validNumber = true;
                } else {
                    _validNumber = false;
                }

                arrPay.forEach((pay) => {
                    if (this._restaurantForm.value.paymentMethods[pay]) {
                        _lPaymentMethods.push(pay);
                    }
                });

                if (this._restaurantForm.controls['country'].valid && this._restaurantForm.controls['city'].valid
                    && this._restaurantForm.controls['name'].valid && this._restaurantForm.controls['address'].valid
                    && this._restaurantForm.controls['phone'].valid && this._restaurantForm.controls['tables_number'].valid
                    && _lPaymentMethods.length > 0 && _validNumber) {
                    return true;
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
        if (this.canMove(this.selectedIndex + 1)) {
            this.selectedIndex++;
        }
    }

    /**
     * This function move to the previous tab
     */
    previous(): void {
        if (this.selectedIndex === 0) {
            return;
        }
        if (this.canMove(this.selectedIndex - 1)) {
            this.selectedIndex--;
        }
    }

    /**
     * Function to cancel add Restaurant 
     */
    cancel(): void {
        if (this._selectedCountryValue !== "") { this._selectedCountryValue = ""; }
        if (this._selectedCityValue !== "") { this._selectedCityValue = ""; }
        this._restaurantForm.controls['paymentMethods'].reset();
        this._restaurantForm.controls['name'].reset();
        this._restaurantForm.controls['address'].reset();
        this._restaurantForm.controls['phone'].reset();
        this._restaurantForm.controls['tables_number'].reset();
        this._router.navigate(['app/restaurant']);
    }

    /**
     * Create Payment Methods
     */
    createPaymentMethods(): void {
        PaymentMethods.collection.find({}).fetch().forEach((pay) => {
            if (this._paymentsFormGroup.contains(pay._id)) {
                this._paymentsFormGroup.controls[pay._id].setValue(false);
            } else {
                let control: FormControl = new FormControl(false);
                this._paymentsFormGroup.addControl(pay._id, control);
            }
        });
    }

    /**
     * Function to add Restaurant
     */
    addRestaurant(): void {
        if (!this._user) {
            this.openDialog(this.titleMsg, '', 'LOGIN_SYSTEM_OPERATIONS_MSG', '', this.btnAcceptLbl, false);
            return;
        }

        this._mdDialogRef = this._mdDialog.open(CreateConfirmComponent, {
            disableClose: true
        });

        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                this._loading = true;
                setTimeout(() => {
                    this.createNewRestaurant().then((restaurant_id) => {
                        this._loading = false;
                        let _lMessage: string = this.itemNameTraduction('RESTAURANT_REGISTER.RESTAURANT_CREATED');
                        this._snackBar.open(_lMessage, '', { duration: 2500 });
                        this._router.navigate(['app/restaurant']);
                    }).catch((err) => {
                        this._loading = false;
                        var error: string = this.itemNameTraduction('RESTAURANT_REGISTER.CREATION_ERROR');
                        this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
                        this._router.navigate(['app/restaurant']);
                    });
                }, 2500);
            }
        });
    }

    /**
     * Promise to create new restaurant
     */
    createNewRestaurant(): Promise<string> {
        let cityIdAux: string;
        let cityAux: string;
        let _lNewRestaurant: string;

        return new Promise((resolve, reject) => {
            try {
                let arrPay: any[] = Object.keys(this._restaurantForm.value.paymentMethods);
                let _lPaymentMethodsToInsert: string[] = [];

                arrPay.forEach((pay) => {
                    if (this._restaurantForm.value.paymentMethods[pay]) {
                        _lPaymentMethodsToInsert.push(pay);
                    }
                });

                if (this._selectedCityValue === '0000') {
                    cityIdAux = '';
                    cityAux = this._restaurantForm.value.otherCity;
                } else {
                    cityIdAux = this._selectedCityValue;
                    cityAux = '';
                }

                if (this._createImage) {
                    _lNewRestaurant = Restaurants.collection.insert({
                        creation_user: this._user,
                        creation_date: new Date(),
                        modification_user: '-',
                        modification_date: new Date(),
                        countryId: this._restaurantForm.value.country,
                        cityId: cityIdAux,
                        other_city: cityAux,
                        name: this._restaurantForm.value.name,
                        currencyId: this._restaurantCurrencyId,
                        address: this._restaurantForm.value.address,
                        indicative: this._countryIndicative,
                        phone: this._restaurantForm.value.phone,
                        restaurant_code: this.generateRestaurantCode(),
                        paymentMethods: _lPaymentMethodsToInsert,
                        tip_percentage: this._tipValue,
                        image: this._restaurantImageToInsert,
                        tables_quantity: 0,
                        orderNumberCount: 0,
                        max_jobs: 5,
                        queue: this._queues,
                        isActive: true,
                        firstPay: true,
                        freeDays: true,
                        is_beta_tester: false
                    });
                } else {
                    _lNewRestaurant = Restaurants.collection.insert({
                        creation_user: this._user,
                        creation_date: new Date(),
                        modification_user: '-',
                        modification_date: new Date(),
                        countryId: this._restaurantForm.value.country,
                        cityId: cityIdAux,
                        other_city: cityAux,
                        name: this._restaurantForm.value.name,
                        currencyId: this._restaurantCurrencyId,
                        address: this._restaurantForm.value.address,
                        indicative: this._countryIndicative,
                        phone: this._restaurantForm.value.phone,
                        restaurant_code: this.generateRestaurantCode(),
                        paymentMethods: _lPaymentMethodsToInsert,
                        tip_percentage: this._tipValue,
                        tables_quantity: 0,
                        orderNumberCount: 0,
                        max_jobs: 5,
                        queue: this._queues,
                        isActive: true,
                        firstPay: true,
                        freeDays: true,
                        is_beta_tester: false
                    });
                }

                this._restaurantLegality.restaurant_id = _lNewRestaurant;
                RestaurantsLegality.insert(this._restaurantLegality);

                //Insert tables
                let _lRestau: Restaurant = Restaurants.findOne({ _id: _lNewRestaurant });
                let _lTableNumber: number = this._restaurantForm.value.tables_number;
                this.restaurantCode = _lRestau.restaurant_code;

                for (let _i = 0; _i < _lTableNumber; _i++) {
                    let _lRestaurantTableCode: string = '';
                    let _lTableCode: string = '';

                    _lTableCode = this.generateTableCode();
                    _lRestaurantTableCode = this.restaurantCode + _lTableCode;
                    let _lCodeGenerator = generateQRCode(_lRestaurantTableCode);

                    let _lQrCode = new QRious({
                        background: 'white',
                        backgroundAlpha: 1.0,
                        foreground: 'black',
                        foregroundAlpha: 1.0,
                        level: 'H',
                        mime: 'image/svg',
                        padding: null,
                        size: 150,
                        value: _lCodeGenerator.getQRCode()
                    });

                    let _lNewTable: Table = {
                        creation_user: this._user,
                        creation_date: new Date(),
                        restaurantId: _lNewRestaurant,
                        table_code: _lTableCode,
                        is_active: true,
                        QR_code: _lCodeGenerator.getQRCode(),
                        QR_information: {
                            significativeBits: _lCodeGenerator.getSignificativeBits(),
                            bytes: _lCodeGenerator.getFinalBytes()
                        },
                        amount_people: 0,
                        status: 'FREE',
                        QR_URI: _lQrCode.toDataURL(),
                        _number: _i + 1
                    };
                    Tables.insert(_lNewTable);
                    Restaurants.update({ _id: _lNewRestaurant }, { $set: { tables_quantity: _i + 1 } })
                }

                let _lCurrency: Currency;
                Currencies.find({ _id: _lRestau.currencyId }).fetch().forEach((cu) => {
                    _lCurrency = cu;
                });

                PaymentsHistory.collection.insert({
                    restaurantIds: [_lNewRestaurant],
                    startDate: this._firstMonthDay,
                    endDate: this._lastMonthDay,
                    month: (this._currentDate.getMonth() + 1).toString(),
                    year: (this._currentDate.getFullYear()).toString(),
                    status: 'TRANSACTION_STATUS.APPROVED',
                    creation_user: Meteor.userId(),
                    creation_date: new Date(),
                    paymentValue: 0,
                    currency: _lCurrency.code,
                    isInitial: true
                });

                if (Additions.collection.find({ creation_user: this._user }).count() > 0) {
                    Additions.collection.find({ creation_user: this._user }).forEach(function <Addition>(addition, index, arr) {
                        addition.prices.forEach(function <AdditionPrice>(additionPrice, index, arr) {
                            if (_lCurrency._id === additionPrice.currencyId) {
                                let _lAdditionRestaurant: AdditionRestaurant = { restaurantId: _lRestau._id, price: additionPrice.price };
                                Additions.update({ _id: addition._id }, { $push: { restaurants: _lAdditionRestaurant } });
                            }
                        });
                    });
                }

                if (GarnishFoodCol.collection.find({ creation_user: this._user }).count() > 0) {
                    GarnishFoodCol.collection.find({ creation_user: this._user }).forEach(function <GarnishFood>(garnishFood, index, arr) {
                        garnishFood.prices.forEach(function <GarnishFoodPrice>(garnishFoodPrice, index, arr) {
                            if (_lCurrency._id === garnishFoodPrice.currencyId) {
                                let _lGarnishFoodRestaurant: GarnishFoodRestaurant = { restaurantId: _lRestau._id, price: garnishFoodPrice.price };
                                GarnishFoodCol.update({ _id: garnishFood._id }, { $push: { restaurants: _lGarnishFoodRestaurant } })
                            }
                        })
                    });
                }

                resolve(_lNewRestaurant);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Function to translate information
     * @param {string} _itemName
     */
    itemNameTraduction(_itemName: string): string {
        var _wordTraduced: string;
        this._translate.get(_itemName).subscribe((res: string) => {
            _wordTraduced = res;
        });
        return _wordTraduced;
    }

    /**
     * Function to change country
     * @param {string} _country
     */
    changeCountry(_country) {
        this._selectedCountryValue = _country;
        this._restaurantForm.controls['country'].setValue(_country);

        let _lCountry: Country;
        Countries.find({ _id: _country }).fetch().forEach((c) => {
            _lCountry = c;
            this.max_table_number = _lCountry.max_number_tables;
        });
        let _lCurrency: Currency;
        Currencies.find({ _id: _lCountry.currencyId }).fetch().forEach((cu) => {
            _lCurrency = cu;
        });
        this._restaurantCurrencyId = _lCurrency._id;
        this._restaurantCurrency = _lCurrency.code + ' - ' + this.itemNameTraduction(_lCurrency.name);
        this._countryIndicative = _lCountry.indicative;
        this._queues = _lCountry.queue;
        this._cities = Cities.find({ country: _country }).zone();

        this._restaurantForm.get('tables_number').enable();
    }

    /**
     * Function to change city
     * @param {string} _city
     */
    changeCity(_city) {

        if (_city === '0000') {
            this._showMessage = true;
            this._restaurantForm.controls['otherCity'].setValidators(Validators.compose([Validators.required, Validators.minLength(1), Validators.maxLength(50)]));
        } else {
            this._showMessage = false;
            this._restaurantForm.controls['otherCity'].clearValidators();
        }

        this._selectedCityValue = _city;
        this._restaurantForm.controls['city'].setValue(_city);
    }

    /**
     * Function to insert new image
     */
    changeImage(): void {
        this._imageService.client.pick(this._imageService.pickOptions).then((res) => {
            let _imageToUpload: any = res.filesUploaded[0];
            this._nameImageFile = _imageToUpload.filename;
            this._restaurantImageToInsert = _imageToUpload;
            this._createImage = true;
        }).catch((err) => {
            var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
        });
    }

    /**
     * Function to generate Restaurant code
     */
    generateRestaurantCode(): string {
        let _lCode: string = '';

        while (true) {
            _lCode = createRestaurantCode();
            if (Restaurants.find({ restaurant_code: _lCode }).cursor.count() === 0) {
                break;
            }
        }
        return _lCode;
    }

    /**
     * Set restaurant legality
     * @param {RestaurantLegality} _event
     */
    setRestaurantLegality(_event: RestaurantLegality): void {
        this._restaurantLegality = _event;
        this.addRestaurant();
    }

    /**
     * Set Restaurant Financial Information
     * @return {string} 
     */
    generateTableCode(): string {
        let _lCode: string = '';

        while (true) {
            _lCode = createTableCode();
            if (Tables.find({ table_code: _lCode }).cursor.count() === 0) {
                break;
            }
        }
        return _lCode;
    }

    /**
     * Run previous function
     * @param {boolean} _event 
     */
    runPrevious(_event: boolean): void {
        if (_event) {
            this.previous();
        }
    }

    /**
     * Set restaurant tip value
     * @param {number} _event
     */
    setTipValue(_event: number): void {
        this._tipValue = _event;
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
