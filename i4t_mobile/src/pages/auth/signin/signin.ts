import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { App, ViewController, NavController, AlertController, Platform, LoadingController } from 'ionic-angular';
//import { OneSignal } from 'ionic-native';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Device } from '@ionic-native/device';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { Meteor } from 'meteor/meteor';
//import { HomeMenu } from '../../customer/home-menu/home-menu';
import { HomePage } from '../../customer/home/home';
//import { Menu } from '../../waiter/menu/menu';
import { TabsPage } from '../../waiter/tabs/tabs';
import { UserLogin } from 'i4t_web/both/models/auth/user-login.model';
import { Accounts } from 'meteor/accounts-base';
import { Facebook } from '@ionic-native/facebook';
import { Network } from '@ionic-native/network';
import { Subscription } from 'rxjs/Subscription';

/*
  Generated class for the Signin page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
    selector: 'page-signin',
    templateUrl: 'signin.html'
})
export class SigninComponent implements OnInit {

    signinForm: FormGroup;
    error: string;
    role_id: string;
    userLang: string;
    private disconnectSubscription: Subscription;

    constructor(public _app: App,
        public zone: NgZone,
        public formBuilder: FormBuilder,
        public translate: TranslateService,
        public navCtrl: NavController,
        public _alertCtrl: AlertController,
        public viewCtrl: ViewController,
        public _loadingCtrl: LoadingController,
        public _platform: Platform,
        private _network: Network,
        private _device: Device) {
        this.userLang = navigator.language.split('-')[0];
        translate.setDefaultLang('en');
        translate.use(this.userLang);
    }

    ngOnInit() {
        this.signinForm = new FormGroup({
            email: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(40)]),
            password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)])
        });

        this.error = '';
    }

    login() {
        if (this.signinForm.valid) {
            Meteor.loginWithPassword(this.signinForm.value.email, this.signinForm.value.password, (err) => {
                let confirmMsg: string;
                this.zone.run(() => {
                    if (err) {
                        if (err.reason === 'User not found' || err.reason === 'Incorrect password') {
                            confirmMsg = this.itemNameTraduction('MOBILE.SIGNIN.USER_PASS_INCORRECT');
                        } else {
                            confirmMsg = this.itemNameTraduction('MOBILE.SIGNIN.ERROR');
                        }
                        this.showComfirm(confirmMsg);
                    } else {
                        MeteorObservable.call('getRole').subscribe((role) => {
                            let loading_msg = this.itemNameTraduction('MOBILE.SIGN_OUT.LOADING');

                            let loading = this._loadingCtrl.create({
                                content: loading_msg
                            });
                            loading.present();
                            setTimeout(() => {
                                loading.dismiss();
                                if (role == "400") {
                                    //role 400 customer
                                    //this.addUserDevice();
                                    this.insertUserInfo();
                                    this.navCtrl.setRoot(HomePage);
                                } else if (role == "200") {
                                    MeteorObservable.call('validateEstablishmentIsActive').subscribe((_establishmenttActive) => {
                                        if (_establishmenttActive) {
                                            MeteorObservable.call('validateUserIsActive').subscribe((active) => {
                                                if (active) {
                                                    this.insertUserInfo();
                                                    this.navCtrl.push(TabsPage);
                                                } else {
                                                    let contentMessage = this.itemNameTraduction("MOBILE.SIGNIN.USER_NO_ACTIVE");
                                                    this.showComfirm(contentMessage);
                                                }
                                            });
                                        } else {
                                            let confirmMsg = this.itemNameTraduction('MOBILE.SIGNIN.RESTAURANT_NO_ACTIVE');
                                            this.showComfirm(confirmMsg);
                                        }
                                    });
                                } else {
                                }
                            }, 1500);
                        }, (error) => {
                            this.error = err;
                        });
                    }
                });
            });
        }
    }


    loginWithFacebook() {
        Meteor.loginWithFacebook({ requestPermissions: ['public_profile', 'email'] }, (err) => {
            this.zone.run(() => {
                if (err) {
                    this.error = err;
                } else {
                    this.insertUserDetail();
                    this.insertUserInfo();
                }
            });
        });
    }


    loginWithTwitter() {
        Meteor.loginWithTwitter({ requestPermissions: [] }, (err) => {
            if (err) {
                this.error = err;
            } else {
                this.insertUserDetail();
                this.insertUserInfo();
            }
        });
    }

    loginWithGoogle() {
        Meteor.loginWithGoogle({ requestPermissions: [] }, (err) => {
            this.zone.run(() => {
                if (err) {
                    this.error = err;
                } else {
                    this.insertUserDetail();
                    this.insertUserInfo();
                }
            });
        });
    }

    insertUserDetail() {
        let loading_msg = this.itemNameTraduction('MOBILE.SIGN_OUT.LOADING');

        let loading = this._loadingCtrl.create({
            content: loading_msg
        });
        loading.present();
        setTimeout(() => {
            loading.dismiss();
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
                this.navCtrl.push(HomePage);
            }, (error) => {
                this.error;
            });
        }, 1500);
    }

    sendEmailPrompt() {

        let dialog_title = this.itemNameTraduction('MOBILE.SIGNIN.FORGOT_DIALOG.TITLE');
        let dialog_subtitle = this.itemNameTraduction('MOBILE.SIGNIN.FORGOT_DIALOG.SUBTITLE');
        let dialog_cancel_btn = this.itemNameTraduction('MOBILE.SIGNIN.FORGOT_DIALOG.CANCEL');
        let dialog_send_btn = this.itemNameTraduction('MOBILE.SIGNIN.FORGOT_DIALOG.SEND');
        let dialog_confirm = this.itemNameTraduction('MOBILE.RESET_PASWORD.EMAIL_SEND');

        let prompt = this._alertCtrl.create({
            title: dialog_title,
            message: dialog_subtitle,
            inputs: [
                {
                    name: 'email',
                    placeholder: ''
                },
            ],
            buttons: [
                {
                    text: dialog_cancel_btn,
                    handler: data => {
                    }
                },
                {
                    text: dialog_send_btn,
                    handler: data => {
                        Accounts.forgotPassword({
                            email: data['email']
                        }, (err) => {
                            if (err) {
                                alert(err);
                            } else {
                                alert(dialog_confirm);
                            }
                        });
                    }
                }
            ]
        });
        prompt.present();
    }

    /*addUserDevice(){
        if (this._platform.is('cordova')) {
            OneSignal.getIds().then( data => {
                MeteorObservable.call('userDevicesValidation', data).subscribe(() => {
                    
                }, (error) => {
                    this.error;
                });
            });
        }


    }*/

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
     * Insert User Info
     */
    insertUserInfo(): void {
        let _lUserLogin: UserLogin = new UserLogin();
        _lUserLogin.user_id = Meteor.userId();
        _lUserLogin.login_date = new Date();
        _lUserLogin.app_code_name = navigator.appCodeName;
        _lUserLogin.app_name = navigator.appName;
        _lUserLogin.app_version = navigator.appVersion;
        _lUserLogin.cookie_enabled = navigator.cookieEnabled;
        _lUserLogin.language = navigator.language;
        _lUserLogin.platform = navigator.platform;
        _lUserLogin.cordova_version = this._device.cordova;
        _lUserLogin.model = this._device.model;
        _lUserLogin.platform_device = this._device.platform;
        _lUserLogin.version = this._device.version;
        MeteorObservable.call('insertUserLoginInfo', _lUserLogin).subscribe();
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
        if (this._platform.is('cordova')) {
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
        let alert = this._alertCtrl.create({
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

    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
    }

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this.translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }
}
