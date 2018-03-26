import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { CustomValidators } from '../../../../../../both/shared-components/validators/custom-validator';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { PaymentPlanInfo } from "../payment-plan-info/payment-plan-info.component";
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { Countries } from '../../../../../../both/collections/general/country.collection';
import { Country } from '../../../../../../both/models/general/country.model';
import { City } from '../../../../../../both/models/general/city.model';
import { Cities } from '../../../../../../both/collections/general/city.collection';
import { UserProfile } from '../../../../../../both/models/auth/user-profile.model';
import { AuthClass } from '../auth.class';

@Component({
    selector: 'admin-signup',
    templateUrl: './admin-signup.component.html',
    styleUrls: ['./admin-signup.component.scss']
})
export class AdminSignupComponent extends AuthClass implements OnInit, OnDestroy {

    private _countrySub: Subscription;
    private _countries: Observable<Country[]>;
    private _citySub: Subscription;
    private _cities: Observable<City[]>;
    private _selectedCountry: string;
    private _selectedCity: string = "";
    private _showOtherCity: boolean = false;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private signupForm: FormGroup;
    private showLoginPassword: boolean = true;
    private showConfirmError: boolean = false;
    private userProfile = new UserProfile();

    private _genderArray: any[] = [];


    /**
     * AdminSignupComponent Constructor
     * @param {Router} router 
     * @param {NgZone} zone 
     * @param {FormBuilder} formBuilder 
     * @param {TranslateService} translate 
     * @param {NgZone} _ngZone 
     */
    constructor(protected router: Router,
        protected zone: NgZone,
        protected translate: TranslateService,
        protected _mdDialog: MatDialog) {
        super(router, zone, translate, _mdDialog);
    }

    ngOnInit() {
        this.removeSubscriptions();
        this.signupForm = new FormGroup({
            fullName: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]),
            username: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20), CustomValidators.noSpacesValidator]),
            email: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(255), CustomValidators.emailValidator]),
            password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
            confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
            //country: new FormControl('', [Validators.required]),
            //city: new FormControl('', [Validators.required]),
            //otherCity: new FormControl(),
            //gender: new FormControl('', [Validators.required]), 
        });

        this._countrySub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this.zone.run(() => {
                this._countries = Countries.find({}).zone();
            });
        });

        this._citySub = MeteorObservable.subscribe('cities').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this.zone.run(() => {
                this._cities = Cities.find({ country: '' }).zone();
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
    *@param {Country} _country
    */
    changeCountry(_country: Country) {
        this._cities = Cities.find({ country: _country._id }).zone();
    }

    /**
     * This function changes de city to select other city
     * @param {string} cityId
     */
    changeOtherCity(cityId: string) {
        this._showOtherCity = true;
        this.signupForm.controls['otherCity'].setValidators(Validators.compose([Validators.required, Validators.minLength(1), Validators.maxLength(50)]));
    }

    /**
     * This function changes de city 
     */
    changeCity() {
        this._showOtherCity = false;
        this.signupForm.controls['otherCity'].clearValidators();
    }

    /**
     * This function makes the administrator register for iurest establishment
     */
    register() {

        let cityIdAux: string;
        let cityAux: string;
        if (this.signupForm.value.password == this.signupForm.value.confirmPassword) {
            this.userProfile.full_name = this.signupForm.value.fullName;
            this.userProfile.language_code = this.getUserLang();
            this.userProfile.gender = "";

            if (this.signupForm.valid) {
                let confirmMsg: string;
                if (this._selectedCity === '0000') {
                    cityIdAux = '';
                    cityAux = this.signupForm.value.otherCity;
                } else {
                    cityIdAux = this._selectedCity;
                    cityAux = '';
                }
                Accounts.createUser({
                    username: this.transformToLower(this.signupForm.value.username),
                    email: this.transformToLower(this.signupForm.value.email),
                    password: this.signupForm.value.password,
                    profile: this.userProfile
                }, (err) => {
                    this.zone.run(() => {
                        if (err) {
                            let confirmMsg: string;
                            if (err.reason === 'Username already exists.' || err.reason === 'Email already exists.') {
                                confirmMsg = 'SIGNUP.USER_EMAIL_EXISTS';
                            } else {
                                confirmMsg = 'SIGNUP.ERROR'
                            }
                            this.openDialog(this.titleMsg, '', confirmMsg, '', this.btnAcceptLbl, false);
                        } else {
                            confirmMsg = 'SIGNUP.SUCCESS'
                            UserDetails.insert({
                                user_id: Meteor.userId(),
                                role_id: '100',
                                is_active: true,
                                contact_phone: "",
                                dni_number: "",
                                address: "",
                                country_id: "",
                                city_id: "",
                                other_city: "",
                                show_after_rest_creation: true,
                            });
                            this.openDialog(this.titleMsg, '', confirmMsg, '', this.btnAcceptLbl, false);
                            Meteor.logout();
                            this.router.navigate(['']);
                        }
                    });
                });
            }

        } else {
            this.showConfirmError = true;
        }
    }

    openPaymentPlanInfoDialog() {
        this._mdDialogRef = this._mdDialog.open(PaymentPlanInfo, {
            disableClose: true
        });
    }

    ngOnDestroy() {
        this.removeSubscriptions();
    }
}