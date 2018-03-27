import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ViewController, NavController, AlertController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { CustomValidators } from '../../../validators/custom-validator';
import { UserProfile } from 'i4t_web/both/models/auth/user-profile.model';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { SigninComponent } from '../signin/signin';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { InitialComponent } from '../initial/initial';
import { Network } from '@ionic-native/network';
import { Subscription } from 'rxjs/Subscription';

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

    private _genderArray: any[] = [];
    private _selectedGender: string;
    private disconnectSubscription: Subscription;

    constructor(public zone: NgZone,
        public _alertCtrl: AlertController,
        public formBuilder: FormBuilder,
        public translate: TranslateService,
        public navCtrl: NavController,
        public alertCtrl: AlertController,
        public viewCtrl: ViewController,
        private _network: Network,
        public platform: Platform) {

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

        this._genderArray = [{ value: "SIGNUP.MALE_GENDER", label: "SIGNUP.MALE_GENDER" },
        { value: "SIGNUP.FEMALE_GENDER", label: "SIGNUP.FEMALE_GENDER" },
        { value: "SIGNUP.OTHER_GENDER", label: "SIGNUP.OTHER_GENDER" }];
    }

    register() {

        if (this.signupForm.value.password == this.signupForm.value.confirmPassword) {
            this.userProfile.full_name = "";
            this.userProfile.language_code = this.userLang;
            this.userProfile.gender = "";

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
                                grant_start_points: true,
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
                    grant_start_points: true,
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
     * This function verify the conditions on page did enter for internet and server connection
    */
    ionViewDidEnter() {
        this.isConnected();
        this.disconnectSubscription = this._network.onDisconnect().subscribe(data => {
            let title = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.TITLE');
            let subtitle = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.SUBTITLE');
            let btn = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.BTN');
            this.presentAlert(title, subtitle, btn);
        }, error => console.error(error));
    }

    /** 
     * This function verify with network plugin if device has internet connection
    */
    isConnected() {
        if (this.platform.is('cordova')) {
            let conntype = this._network.type;
            let validateConn = conntype && conntype !== 'unknown' && conntype !== 'none';
            if (!validateConn) {
                let title = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.TITLE');
                let subtitle = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.SUBTITLE');
                let btn = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.BTN');
                this.presentAlert(title, subtitle, btn);
            } else {
                if (!Meteor.status().connected) {
                    let title2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.TITLE');
                    let subtitle2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.SUBTITLE');
                    let btn2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.BTN');
                    this.presentAlert(title2, subtitle2, btn2);
                }
            }
        }
    }

    /**
     * Present the alert for advice to internet
    */
    presentAlert(_pTitle: string, _pSubtitle: string, _pBtn: string) {
        let alert = this.alertCtrl.create({
            title: _pTitle,
            subTitle: _pSubtitle,
            enableBackdropDismiss: false,
            buttons: [
                {
                    text: _pBtn,
                    handler: () => {
                        this.isConnected();
                    }
                }
            ]
        });
        alert.present();
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

    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
    }

}