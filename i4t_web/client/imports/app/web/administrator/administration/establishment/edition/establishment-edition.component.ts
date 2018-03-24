import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Establishment, EstablishmentImage } from '../../../../../../../../both/models/establishment/establishment.model';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { PaymentMethod } from '../../../../../../../../both/models/general/paymentMethod.model';
import { PaymentMethods } from '../../../../../../../../both/collections/general/paymentMethod.collection';
import { Countries } from '../../../../../../../../both/collections/general/country.collection';
import { Country } from '../../../../../../../../both/models/general/country.model';
import { City } from '../../../../../../../../both/models/general/city.model';
import { Cities } from '../../../../../../../../both/collections/general/city.collection';
import { Parameter } from '../../../../../../../../both/models/general/parameter.model';
import { Parameters } from '../../../../../../../../both/collections/general/parameter.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';
import { ImageService } from '../../../../services/general/image.service';
import { PointValidity } from '../../../../../../../../both/models/general/point-validity.model';
import { PointsValidity } from '../../../../../../../../both/collections/general/point-validity.collection';

@Component({
    selector: 'establishment-edition',
    templateUrl: './establishment-edition.component.html',
    styleUrls: ['./establishment-edition.component.scss']
})
export class EstablishmentEditionComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _establishmentToEdit: Establishment;
    private _establishmentEditionForm: FormGroup;
    private _paymentsFormGroup: FormGroup = new FormGroup({});
    private _mdDialogRef: MatDialogRef<any>;

    private _establishmentSub: Subscription;
    private _currencySub: Subscription;
    private _countriesSub: Subscription;
    private _citiesSub: Subscription;
    private _paymentMethodsSub: Subscription;
    private _parameterSub: Subscription;
    private _pointValiditySub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _countries: Observable<Country[]>;
    private _cities: Observable<City[]>;
    private _currencies: Observable<Currency[]>;
    private _parameterDaysTrial: Observable<Parameter[]>;
    private _pointsValidity: Observable<PointValidity[]>;

    private _paymentMethods: PaymentMethod[] = [];
    private _paymentMethodsList: PaymentMethod[] = [];
    private _establishmentPaymentMethods: string[] = [];

    private _establishmentImageToEdit: EstablishmentImage;
    private _editImage: boolean = false;
    private _nameImageFileEdit: string = "";
    public _selectedIndex: number = 0;
    private _establishmentEditImageUrl: string;

    private _queue: string[] = [];
    private _selectedCountryValue: string = "";
    private _selectedCityValue: string = "";

    private _establishmentCountryValue: string;
    private _establishmentCityValue: string;

    private _establishmentCurrency: string = '';
    private _countryIndicative: string;
    private titleMsg: string;
    private btnAcceptLbl: string;

    private _showOtherCity: boolean;

    /**
     * EstablishmentEditionComponent Constructor
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {ActivatedRoute} _route 
     * @param {Router} _router 
     * @param {UserLanguageService} _userLanguageService
     * @param {ImageService} _imageService
     */
    constructor(private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        private _route: ActivatedRoute,
        private _router: Router,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog,
        private _imageService: ImageService) {
        let _lng: string = this._userLanguageService.getLanguage(Meteor.user());
        _translate.use(_lng);
        _translate.setDefaultLang('en');
        this._imageService.setPickOptionsLang(_lng);

        this._route.params.forEach((params: Params) => {
            this._establishmentToEdit = JSON.parse(params['param1']);
        });

        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let _establishmentImg: EstablishmentImage = Establishments.findOne({ _id: this._establishmentToEdit._id }).image;
                if (_establishmentImg) {
                    this._establishmentEditImageUrl = _establishmentImg.url;
                } else {
                    this._establishmentEditImageUrl = '/images/default-restaurant.png';
                }
            });
        });

        this._countriesSub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._countries = Countries.find({}).zone();
                let _lCountry: Country = Countries.findOne({ _id: this._establishmentToEdit.countryId });
            });
        });

        this._citiesSub = MeteorObservable.subscribe('citiesByCountry', this._establishmentToEdit.countryId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._cities = Cities.find({}).zone();
            });
        });

        this._currencySub = MeteorObservable.subscribe('currencies').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let find: Currency = Currencies.findOne({ _id: this._establishmentToEdit.currencyId });
                this._establishmentCurrency = find.code + ' - ' + this.itemNameTraduction(find.name);
            });
        });

        this._paymentMethodsSub = MeteorObservable.subscribe('paymentMethods').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._paymentMethods = PaymentMethods.collection.find({}).fetch();
                for (let pay of this._paymentMethods) {
                    let paymentTranslated: PaymentMethod = {
                        _id: pay._id,
                        isActive: pay.isActive,
                        name: this.itemNameTraduction(pay.name)
                    };

                    let find = this._establishmentPaymentMethods.filter(p => p === paymentTranslated._id);

                    if (find.length > 0) {
                        let control: FormControl = new FormControl(true);
                        this._paymentsFormGroup.addControl(paymentTranslated.name, control);
                        this._paymentMethodsList.push(paymentTranslated);
                    } else {
                        let control: FormControl = new FormControl(false);
                        this._paymentsFormGroup.addControl(paymentTranslated.name, control);
                        this._paymentMethodsList.push(paymentTranslated);
                    }
                }
            });
        });

        this._parameterSub = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._parameterDaysTrial = Parameters.find({ _id: '100' });
        });

        this._pointValiditySub = MeteorObservable.subscribe('pointsValidity').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._pointsValidity = PointsValidity.find({ '_id': { $gte: '20' } }).zone();
            });
        });

        this._establishmentEditionForm = new FormGroup({
            editId: new FormControl(this._establishmentToEdit._id),
            country: new FormControl(this._establishmentToEdit.countryId),
            city: new FormControl(this._establishmentToEdit.cityId),
            name: new FormControl(this._establishmentToEdit.name),
            address: new FormControl(this._establishmentToEdit.address),
            phone: new FormControl(this._establishmentToEdit.phone),
            editImage: new FormControl(''),
            pointsValidity: new FormControl(this._establishmentToEdit.points_validity),
            paymentMethods: this._paymentsFormGroup,
            otherCity: new FormControl(this._establishmentToEdit.other_city)
        });


        this._selectedCountryValue = this._establishmentToEdit.countryId;
        this._establishmentCountryValue = this._establishmentToEdit.countryId;
        if ((this._establishmentToEdit.cityId === null || this._establishmentToEdit.cityId === '') && this._establishmentToEdit.other_city !== '') {
            this._selectedCityValue = '0000';
            this._showOtherCity = true;
        } else {
            this._selectedCityValue = this._establishmentToEdit.cityId;
            this._showOtherCity = false;
        }

        this._establishmentCityValue = this._establishmentToEdit.cityId;
        this._establishmentPaymentMethods = this._establishmentToEdit.paymentMethods;
        this._countryIndicative = this._establishmentToEdit.indicative;
        this._queue = this._establishmentToEdit.queue;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Funtion to edit establishment
     */
    editEstablishment(): void {
        if (!Meteor.userId()) {
            this.openDialog(this.titleMsg, '', 'LOGIN_SYSTEM_OPERATIONS_MSG', '', this.btnAcceptLbl, false);
            return;
        }

        let cityIdAux: string;
        let cityAux: string;

        let arrPay: any[] = Object.keys(this._establishmentEditionForm.value.paymentMethods);
        let _lPaymentMethodsToInsert: string[] = [];

        arrPay.forEach((pay) => {
            if (this._establishmentEditionForm.value.paymentMethods[pay]) {
                let _lPayment: PaymentMethod = this._paymentMethodsList.filter(p => p.name === pay)[0];
                _lPaymentMethodsToInsert.push(_lPayment._id);
            }
        });

        if (this._selectedCityValue === '0000' || this._selectedCityValue == "") {
            cityIdAux = '';
            cityAux = this._establishmentEditionForm.value.otherCity;
        } else {
            cityIdAux = this._selectedCityValue;
            cityAux = '';
        }

        if (this._editImage) {
            /*let _lEstablishmentImage: EstablishmentImage = Establishments.findOne({ _id: this._establishmentToEdit._id }).image;
            if (_lEstablishmentImage) {
                this._imageService.client.remove(_lEstablishmentImage.handle).then((res) => {
                    console.log(res);
                }).catch((err) => {
                    var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
                    this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
                });
            }*/
            Establishments.update(this._establishmentEditionForm.value.editId, {
                $set: {
                    modification_user: Meteor.userId(),
                    modification_date: new Date(),
                    countryId: this._establishmentEditionForm.value.country,
                    cityId: cityIdAux,
                    other_city: cityAux,
                    name: this._establishmentEditionForm.value.name,
                    address: this._establishmentEditionForm.value.address,
                    phone: this._establishmentEditionForm.value.phone,
                    paymentMethods: _lPaymentMethodsToInsert,
                    points_validity: this._establishmentEditionForm.value.pointsValidity,
                    queue: this._queue,
                    image: this._establishmentImageToEdit
                }
            });
        } else {
            Establishments.update(this._establishmentEditionForm.value.editId, {
                $set: {
                    modification_user: Meteor.userId(),
                    modification_date: new Date(),
                    countryId: this._establishmentEditionForm.value.country,
                    cityId: cityIdAux,
                    other_city: cityAux,
                    name: this._establishmentEditionForm.value.name,
                    address: this._establishmentEditionForm.value.address,
                    phone: this._establishmentEditionForm.value.phone,
                    paymentMethods: _lPaymentMethodsToInsert,
                    points_validity: this._establishmentEditionForm.value.pointsValidity,
                    queue: this._queue
                }
            });
        }
        this.cancel();
    }

    /**
     * Function to cancel edition
     */
    cancel(): void {
        this._router.navigate(['app/establishment']);
    }

    /**
     * Function to change country
     * @param {string} _country
     */
    changeCountry(_country) {
        this._selectedCountryValue = _country;
        this._establishmentEditionForm.controls['country'].setValue(_country);
        this._cities = Cities.find({ country: _country }).zone();

        let _lCountry: Country;
        Countries.find({ _id: _country }).fetch().forEach((c) => {
            _lCountry = c;
        });
        let _lCurrency: Currency;
        Currencies.find({ _id: _lCountry.currencyId }).fetch().forEach((cu) => {
            _lCurrency = cu;
        });
        this._establishmentCurrency = _lCurrency.code + ' - ' + this.itemNameTraduction(_lCurrency.name);
        this._countryIndicative = _lCountry.indicative;
        this._queue = _lCountry.queue;
    }

    /**
     * Function to change city
     * @param {string} _city
     */
    changeCity(_city) {
        let control = this._establishmentEditionForm.get('otherCity');
        if (_city === '0000') {
            this._showOtherCity = true;
            control.setValidators(Validators.compose([Validators.required, Validators.minLength(1), Validators.maxLength(50)]));
        } else {
            this._showOtherCity = false;
            control.clearValidators();
            control.reset();
        }
    }

    /**
     * Function to insert new image
     */
    changeImage(): void {
        this._imageService.client.pick(this._imageService.pickOptions).then((res) => {
            let _imageToUpload: any = res.filesUploaded[0];
            this._nameImageFileEdit = _imageToUpload.filename;
            this._establishmentImageToEdit = _imageToUpload;
            this._editImage = true;
        }).catch((err) => {
            var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
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