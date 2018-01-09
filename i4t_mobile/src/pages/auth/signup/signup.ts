import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ViewController, NavController, AlertController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { CustomValidators } from '../../../validators/custom-validator';
import { UserProfile } from 'i4t_web/both/models/auth/user-profile.model';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { SigninComponent } from '../signin/signin';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { InitialComponent } from '../initial/initial';

import { Facebook } from '@ionic-native/facebook';

@Component({
    selector: 'page-signup',
    templateUrl: 'signup.html'
})

export class SignupComponent implements OnInit {

    signupForm: FormGroup;
    error: string;
    showLoginPassword: boolean = true;
    showConfirmError: boolean = false;
    userLang: string;
    userProfile = new UserProfile();

    constructor(public zone: NgZone,
        public _alertCtrl: AlertController,
        public formBuilder: FormBuilder,
        public translate: TranslateService,
        public navCtrl: NavController,
        public alertCtrl: AlertController,
        public viewCtrl: ViewController) {

        this.userLang = navigator.language.split('-')[0];
        translate.setDefaultLang('en');
        translate.use(this.userLang);
    }

    ngOnInit() {
        this.signupForm = new FormGroup({
            username: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]),
            email: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(40), CustomValidators.emailValidator]),
            password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
            confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)])
        });
        this.error = '';
    }

    register() {

        if (this.signupForm.value.password == this.signupForm.value.confirmPassword) {

            this.userProfile.first_name = "";
            this.userProfile.last_name = "";
            this.userProfile.language_code = this.userLang;

            if (this.signupForm.valid) {
                let confirmMsg: string;
                Accounts.createUser({
                    email: this.signupForm.value.email,
                    password: this.signupForm.value.password,
                    username: this.signupForm.value.username,
                    profile: this.userProfile
                }, (err) => {
                    this.zone.run(() => {
                        if (err) {
                            if (err.reason === 'Username already exists.' || err.reason === 'Email already exists.') {
                                confirmMsg = 'MOBILE.SIGNUP.USER_EMAIL_EXISTS';
                            } else {
                                confirmMsg = 'MOBILE.SIGNUP.ERROR'
                            }
                            this.showComfirm(this.itemNameTraduction(confirmMsg));
                        } else {
                            UserDetails.insert({
                                user_id: Meteor.userId(),
                                role_id: '400',
                                is_active: true,
                                establishment_work: '',
                                penalties: [],
                                current_establishment: '',
                                current_table: ''
                            });
                            confirmMsg = 'MOBILE.SIGNUP.SUCCESS';
                            this.showComfirm(this.itemNameTraduction(confirmMsg));
                            Meteor.logout();
                            //this.navCtrl.setRoot(InitialComponent);
                            this.navCtrl.pop();
                        }
                    });
                });
            }

        } else {
            this.showConfirmError = true;
        }
    }


    loginWithFacebook() {
        Meteor.loginWithFacebook({ requestPermissions: ['public_profile', 'email'], loginStyle: 'popup' }, (err) => {

            this.zone.run(() => {
                if (err) {
                    this.error = err;
                } else {
                    this.insertUserDetail();
                }
            });
        });
    }


    loginWithTwitter() {
        Meteor.loginWithTwitter({ requestPermissions: [] }, (err) => {
            this.zone.run(() => {
                if (err) {
                    this.error = err;
                } else {
                    this.insertUserDetail();
                }
            });
        });
    }

    loginWithGoogle() {
        Meteor.loginWithGoogle({ requestPermissions: [] }, (err) => {
            this.zone.run(() => {
                if (err) {
                    this.error = err;
                } else {
                    this.insertUserDetail();
                }
            });
        });
    }

    insertUserDetail() {
        MeteorObservable.call('getDetailsCount').subscribe((count) => {

            if (count === 0) {
                UserDetails.insert({
                    user_id: Meteor.userId(),
                    role_id: '400',
                    is_active: true,
                    establishment_work: '',
                    penalties: [],
                    current_establishment: '',
                    current_table: ''
                });
            }

            //this.router.navigate(['app/orders']);
            //this.roamWeb('app/orders');
            this.navCtrl.push(SigninComponent);

        }, (error) => {
            this.error;
        });
    }

    /**
     * Function that allows show comfirm dialog
     * @param { any } _call 
     */
    showComfirm(_pContent: string) {
        let okBtn = this.itemNameTraduction('MOBILE.OK');
        let title = this.itemNameTraduction('MOBILE.SYSTEM_MSG');

        let prompt = this._alertCtrl.create({
            title: title,
            message: _pContent,
            buttons: [
                {
                    text: okBtn,
                    handler: data => {
                    }
                }
            ]
        });
        prompt.present();
    }

    /**
     * This function allow translate strings
     * @param itemName 
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this.translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

}