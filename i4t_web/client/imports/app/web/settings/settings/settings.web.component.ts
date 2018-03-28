import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription, Observable, Subject } from 'rxjs';
import { UserLanguageService } from '../../services/general/user-language.service';
import { Countries } from '../../../../../../both/collections/general/country.collection';
import { Country } from '../../../../../../both/models/general/country.model';
import { City } from '../../../../../../both/models/general/city.model';
import { Cities } from '../../../../../../both/collections/general/city.collection';
import { Language } from '../../../../../../both/models/general/language.model';
import { Languages } from '../../../../../../both/collections/general/language.collection';
import { Users } from '../../../../../../both/collections/auth/user.collection';
import { User } from '../../../../../../both/models/auth/user.model';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail, UserDetailImage } from '../../../../../../both/models/auth/user-detail.model';
import { ChangeEmailWebComponent } from '../modal-dialog/change-email/change-email.web.component';
import { ChangePasswordWebComponent } from '../modal-dialog/change-password/change-password.web.component';
import { AlertConfirmComponent } from '../../../web/general/alert-confirm/alert-confirm.component';
import { ImageService } from '../../services/general/image.service';

@Component({
    selector: 'settings',
    templateUrl: './settings.web.component.html',
    styleUrls: ['./settings.web.component.scss']
})
export class SettingsWebComponent implements OnInit, OnDestroy {

    private _userForm: FormGroup;

    private _userSubscription: Subscription;
    private _userDetailSubscription: Subscription;
    private _subscription: Subscription;
    private _countrySubscription: Subscription;
    private _citySubscription: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _countries: Observable<Country[]>;
    private _cities: Observable<City[]>;
    private _languages: Observable<Language[]>;

    private _mdDialogRef: MatDialogRef<any>;
    private _user: User;
    private _userDetail: UserDetail;

    private _userName: string;
    private _firstName: string;
    private _lastName: string;
    private _message: string;
    private _languageCode: string;
    private _imageProfile: string;
    private _lang_code: string;

    private titleMsg: string;
    private btnAcceptLbl: string;
    private _disabled: boolean = true;
    private _showOtherCity: boolean = false;
    private _validateChangeEmail: boolean = true;
    private _validateChangePass: boolean = true;
    private _loading: boolean = false;
    private _itemImageToInsert: UserDetailImage;

    private _genderArray: any[] = [];

    /**
     * SettingsWebComponent Constructor
     * @param {TranslateService} _translate 
     * @param {MatDialog} _mdDialog
     * @param {UserLanguageService} _userLanguageService 
     * @param {NgZone} _ngZone
     */
    constructor(private _translate: TranslateService,
        public _mdDialog: MatDialog,
        private _userLanguageService: UserLanguageService,
        private _ngZone: NgZone,
        private _imageService: ImageService) {
        let _lUserLanguage = this._userLanguageService.getLanguage(Meteor.user());
        _translate.use(_lUserLanguage);
        _translate.setDefaultLang('en');
        this._languageCode = _lUserLanguage;
        this._lang_code = _lUserLanguage;
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();

        this._userSubscription = MeteorObservable.subscribe('getUserSettings').takeUntil(this._ngUnsubscribe).subscribe();

        this._countrySubscription = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._countries = Countries.find({}).zone();
            });
        });

        this._citySubscription = MeteorObservable.subscribe('cities').takeUntil(this._ngUnsubscribe).subscribe();

        this._subscription = MeteorObservable.subscribe('languages').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._languages = Languages.find({}).zone();
            });
        });

        this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {

                this._user = Users.findOne({ _id: Meteor.userId() });;
                this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });

                if (this._user.services.facebook) {
                    this._userForm = new FormGroup({
                        username: new FormControl({ value: this._user.services.facebook.name, disabled: true }),
                        first_name: new FormControl({ value: this._user.services.facebook.first_name, disabled: true }),
                        last_name: new FormControl({ value: this._user.services.facebook.last_name, disabled: true }),
                    });
                }

                if (this._user.username) {
                    this._userForm = new FormGroup({
                        username: new FormControl({ value: this._user.username, disabled: true }),
                        full_name: new FormControl({ value: this._user.profile.full_name, disabled: false }, [Validators.maxLength(50)]),
                        language_code: new FormControl({ value: this._user.profile.language_code, disabled: false }),
                        gender: new FormControl({ value: this._user.profile.gender, disabled: false }, [Validators.required])
                    });
                    this._validateChangePass = false;
                    if (this._userDetail.role_id === '400') {
                        this._validateChangeEmail = false;
                    } else if (this._userDetail.role_id === '100') {
                        this._validateChangeEmail = false;
                        let dniNumber: FormControl = new FormControl({ value: this._userDetail.dni_number, disabled: false }, [Validators.maxLength(20)]);
                        this._userForm.addControl('dniNumber', dniNumber);

                        let contactPhone: FormControl = new FormControl({ value: this._userDetail.contact_phone, disabled: false }, [Validators.maxLength(20)]);
                        this._userForm.addControl('contactPhone', contactPhone);

                        let shippingAddress: FormControl = new FormControl({ value: this._userDetail.address, disabled: false }, [Validators.maxLength(150)]);
                        this._userForm.addControl('shippingAddress', shippingAddress);

                        let country: FormControl = new FormControl({ value: this._userDetail.country_id, disabled: false });
                        this._userForm.addControl('country', country);

                        this.changeCountry(this._userDetail.country_id);

                        let city: FormControl = new FormControl({ value: this._userDetail.city_id, disabled: false });
                        this._userForm.addControl('city', city);

                        let otherCity: FormControl = new FormControl();
                        this._userForm.addControl('otherCity', otherCity);

                        if (this._userDetail.other_city) {
                            this._showOtherCity = true;
                            this._userForm.controls['city'].setValue('0000');
                            this._userForm.controls['otherCity'].setValue(this._userDetail.other_city);
                        }
                    } else {
                        this._userForm.controls['full_name'].disable();
                    }
                }
            });
        });

        this._genderArray = [{ value: "SIGNUP.MALE_GENDER", label: "SIGNUP.MALE_GENDER" },
        { value: "SIGNUP.FEMALE_GENDER", label: "SIGNUP.FEMALE_GENDER" },
        { value: "SIGNUP.OTHER_GENDER", label: "SIGNUP.OTHER_GENDER" }];

    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
    * This function changes de country to select
    *@param {string} _countryId
    */
    changeCountry(_countryId: string) {
        this._cities = Cities.find({ country: _countryId }).zone();
    }

    /**
     * This function changes de city to select other city
     * @param {string} cityId
     */
    changeOtherCity(cityId: string) {
        this._showOtherCity = true;
        this._userForm.controls['otherCity'].setValidators(Validators.compose([Validators.required, Validators.minLength(1), Validators.maxLength(50)]));
    }

    /**
     * This function changes de city 
     */
    changeCity() {
        this._showOtherCity = false;
        this._userForm.controls['otherCity'].clearValidators();
    }

    /**
     * Return user image
     */
    getUsetImage(): string {
        if (this._user && this._user.services.facebook) {
            return "http://graph.facebook.com/" + this._user.services.facebook.id + "/picture/?type=large";
        } else {
            let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: Meteor.userId() });
            if (_lUserDetail) {
                let _lUserDetailImage: UserDetailImage = _lUserDetail.image;
                if (_lUserDetailImage) {
                    return _lUserDetailImage.url;
                } else {
                    return '/images/user_default_image.png';
                }
            }
            else {
                return '/images/user_default_image.png';
            }
        }
    }

    /**
     * User detail edition 
     */
    editUserDetail(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._userForm.valid) {
            Users.update({ _id: Meteor.userId() }, {
                $set: {
                    profile: {
                        full_name: this._userForm.value.full_name,
                        language_code: this._userForm.value.language_code,
                        gender: this._userForm.value.gender
                    }
                }
            });

            if (this._userDetail.role_id === '100') {
                let citySelected: string = '';
                let othercitySelected: string = '';
                if (this._userForm.value.city === '0000') {
                    othercitySelected = this._userForm.value.otherCity;
                } else {
                    citySelected = this._userForm.value.city;
                }
                UserDetails.update({ _id: this._userDetail._id }, {
                    $set: {
                        contact_phone: this._userForm.value.contactPhone,
                        dni_number: this._userForm.value.dniNumber,
                        address: this._userForm.value.shippingAddress,
                        country_id: this._userForm.value.country,
                        city_id: citySelected,
                        other_city: othercitySelected
                    }
                });
            }

            let message: string;
            message = this.itemNameTraduction('SETTINGS.USER_DETAIL_UPDATED');
            this.openDialog(this.titleMsg, '', message, '', this.btnAcceptLbl, false);
        }
    }

    /**
     * ChangeEmailWebComponent show
     */
    open() {
        this._mdDialogRef = this._mdDialog.open(ChangeEmailWebComponent, {
            disableClose: true
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = null;
        });
    }

    /**
     * ChangePasswordWebComponent show
     */
    openModalChangePassword() {

        this._mdDialogRef = this._mdDialog.open(ChangePasswordWebComponent, {
            disableClose: true
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = null;
        });
    }

    /**
     * Traduction of the strings
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
     * When user wants add image, this function allow insert the image in the store
     */
    changeImage(): void {
        this._imageService.client.pick(this._imageService.pickOptions).then((res) => {
            this._itemImageToInsert = res.filesUploaded[0];
            this._loading = true;
            setTimeout(() => {
                /*let _lUserImage: UserDetailImage = UserDetails.findOne({ userId: Meteor.userId() }).image;
                if (_lUserImage) {
                    this._imageService.client.remove(_lUserImage.handle).then((res) => {
                        console.log(res);
                    }).catch((err) => {
                        var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
                        this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
                    });
                }*/
                UserDetails.update({ _id: this._userDetail._id }, { $set: { image: this._itemImageToInsert } });
                this._loading = false;
            }, 2000);
        }).catch((err) => {
            this._loading = false;
            var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
        });
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