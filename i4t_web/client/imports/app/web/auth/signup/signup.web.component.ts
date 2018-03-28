import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { Accounts } from 'meteor/accounts-base';
import { TranslateService } from '@ngx-translate/core';
import { CustomValidators } from '../../../../../../both/shared-components/validators/custom-validator';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { UserProfile } from '../../../../../../both/models/auth/user-profile.model';
import { AuthClass } from '../auth.class';

@Component({
    selector: 'signup',
    templateUrl: './signup.web.component.html',
    styleUrls: ['../auth.component.scss']
})
export class SignupWebComponent extends AuthClass implements OnInit {

    private signupForm: FormGroup;
    private showLoginPassword: boolean = true;
    private showConfirmError: boolean = false;
    private userProfile = new UserProfile();
    private _genderArray: any[] = [];
    private _selectedGender: string;

    /**
     * SignupWebComponent Constructor
     * @param {Router} router 
     * @param {NgZone} zone 
     * @param {FormBuilder} formBuilder 
     * @param {TranslateService} translate 
     */
    constructor(protected router: Router,
        protected zone: NgZone,
        protected translate: TranslateService,
        protected _mdDialog: MatDialog) {

        super(router, zone, translate, _mdDialog);
    }

    ngOnInit() {
        this.signupForm = new FormGroup({
            username: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20), CustomValidators.noSpacesValidator]),
            email: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(255), CustomValidators.emailValidator]),
            password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
            confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
            gender: new FormControl('', [Validators.required])
        });

        this._genderArray = [{ value: "SIGNUP.MALE_GENDER", label: "SIGNUP.MALE_GENDER" },
        { value: "SIGNUP.FEMALE_GENDER", label: "SIGNUP.FEMALE_GENDER" },
        { value: "SIGNUP.OTHER_GENDER", label: "SIGNUP.OTHER_GENDER" }];
    }

    /**
     * This function creates an iurest user with role customer
     */
    register() {
        if (this.signupForm.value.password == this.signupForm.value.confirmPassword) {

            this.userProfile.first_name = "";
            this.userProfile.last_name = "";
            this.userProfile.language_code = this.getUserLang();
            this.userProfile.gender = this.signupForm.value.gender;

            if (this.signupForm.valid) {
                let confirmMsg: string;
                Accounts.createUser({
                    username: this.transformToLower(this.signupForm.value.username),
                    email: this.transformToLower(this.signupForm.value.email),
                    password: this.signupForm.value.password,
                    profile: this.userProfile
                }, (err) => {
                    this.zone.run(() => {
                        if (err) {
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
                                role_id: '400',
                                is_active: true,
                                penalties: [],
                                grant_start_points: true,
                                current_establishment: '',
                                current_table: ''
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
}