import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { App, LoadingController, ModalController, NavController, NavParams, ToastController, AlertController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription, Subject } from 'rxjs';

import { ChangeEmailPage } from './change-email/change-email';
import { ChangePasswordPage } from './change-password/change-password';

import { Language } from 'i4t_web/both/models/general/language.model';
import { Languages } from 'i4t_web/both/collections/general/language.collection';
import { Users } from 'i4t_web/both/collections/auth/user.collection';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';
import { UserDetail, UserDetailImage } from 'i4t_web/both/models/auth/user-detail.model';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { SigninComponent } from '../../../auth/signin/signin';
import { InitialComponent } from '../../../auth/initial/initial';
import { Network } from '@ionic-native/network';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage implements OnInit, OnDestroy {

  private _userSubscription: Subscription;
  private _userDetailSubscription: Subscription;
  private _languagesSubscription: Subscription;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  private _userForm: FormGroup = new FormGroup({});

  private _disabled: boolean
  private _validate: boolean
  private _email: string;
  private _userName: string;
  private _firstName: string;
  private _lastName: string;
  private _message: string;
  private _languageCode: string;
  private _imageProfile: string;
  private _userLang: string;
  private _user: any;
  private _userDetail: any;
  private _languages: any;
  private _validateChangeEmail: boolean = true;
  private _validateChangePass: boolean = true;
  private disconnectSubscription: Subscription;
  private _genderArray: any[] = [];

  /**
   * SettingsPage constructor
   * @param _navCtrl 
   * @param _navParams 
   * @param _translate 
   * @param _modalCtrl 
   * @param _loadingCtrl 
   * @param _toastCtrl 
   */
  constructor(public _app: App,
    public _navCtrl: NavController,
    public _navParams: NavParams,
    public _translate: TranslateService,
    public _modalCtrl: ModalController,
    public _alertCtrl: AlertController,
    public _loadingCtrl: LoadingController,
    private formBuilder: FormBuilder,
    private _toastCtrl: ToastController,
    private _userLanguageService: UserLanguageServiceProvider,
    private _ngZone: NgZone,
    private _network: Network,
    public _platform: Platform) {
    _translate.setDefaultLang('en');
    this._user = Meteor.user();
  }

  /**
   * ngOnInit implementation
   */
  ngOnInit() {
    this.init();
  }

  /**
   * ionViewWillEnter implementation
   */
  ionViewWillEnter() {
  }

  init() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));

    this.removeSubscriptions();

    this._userSubscription = MeteorObservable.subscribe('getUserSettings').takeUntil(this.ngUnsubscribe).subscribe();

    this._languagesSubscription = MeteorObservable.subscribe('languages').takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        this._languages = Languages.find({}).zone();
      });
    });

    this._genderArray = [{ value: "SIGNUP.MALE_GENDER", label: "SIGNUP.MALE_GENDER" },
    { value: "SIGNUP.FEMALE_GENDER", label: "SIGNUP.FEMALE_GENDER" },
    { value: "SIGNUP.OTHER_GENDER", label: "SIGNUP.OTHER_GENDER" }];

    this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        this._user = Users.findOne({ _id: Meteor.userId() });;
        this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
        let controlsDisabled: boolean = false

        if (this._user && this._user.services.facebook) {
          controlsDisabled = true;
          this._userForm = new FormGroup({
            username: new FormControl({ value: this._user.services.facebook.name, disabled: controlsDisabled }),
            first_name: new FormControl({ value: this._user.services.facebook.first_name, disabled: controlsDisabled }),
            last_name: new FormControl({ value: this._user.services.facebook.last_name, disabled: controlsDisabled }),
          });
        }

        if (this._user && this._user.username) {
          this._userForm = new FormGroup({
            username: new FormControl({ value: this._user.username, disabled: !controlsDisabled }),
            language_code: new FormControl({ value: this._user.profile.language_code, disabled: controlsDisabled }),
            gender: new FormControl({value: this._user.profile.gender, disabled: controlsDisabled})
          });

          this._validateChangePass = false;

          if (this._userDetail.role_id === '400') {
            this._validateChangeEmail = false;
          } else {
            controlsDisabled = true
          }

          /** 
          let first_name: FormControl = new FormControl({ value: this._user.profile.first_name, disabled: controlsDisabled });
          this._userForm.addControl('first_name', first_name);

          let last_name: FormControl = new FormControl({ value: this._user.profile.last_name, disabled: controlsDisabled });
          this._userForm.addControl('last_name', last_name);
          */

          let full_name: FormControl = new FormControl({ value: this._user.profile.full_name, disabled: controlsDisabled });
          this._userForm.addControl('full_name', full_name);
        }
      });
    });
  }

  /**
   * Open email change modal
   */
  openEmail() {
    let contactModal = this._modalCtrl.create(ChangeEmailPage);
    contactModal.present();
  }

  /**
   * Open password change modal
   */
  openPassword() {
    let contactModal = this._modalCtrl.create(ChangePasswordPage);
    contactModal.present();
  }

  /**
   * This function allow update data of the user
   */
  editUserDetail(): void {
    if (this._userForm.valid) {
      this._translate.use(this._userForm.value.language_code);
      let loading_msg = this.itemNameTraduction('MOBILE.WAITER_CALL.LOADING');

      let loading = this._loadingCtrl.create({
        content: loading_msg
      });

      loading.present();
      setTimeout(() => {
        Users.update(
          { _id: Meteor.userId() },
          {
            $set:
              {
                profile: {
                  //first_name: this._userForm.value.first_name,
                  //last_name: this._userForm.value.last_name,
                  full_name: this._userForm.value.full_name,
                  language_code: this._userForm.value.language_code,
                  gender: this._userForm.value.gender
                }
              }
          });
        loading.dismiss();
        this.presentToast();
      }, 1500);
    }
  }

  /**
   * Function that allow show a toast confirmation
   */
  presentToast() {
    let msg = this.itemNameTraduction('MOBILE.SETTINGS.MSG_COMFIRM');
    let toast = this._toastCtrl.create({
      message: msg,
      duration: 1500,
      position: 'middle'
    });

    toast.onDidDismiss(() => {
    });

    toast.present();
  }

  /**
   * Return user image
   */
  getUsetImage(): string {
    if (this._user) {
      if (this._user.services) {
        if (this._user.services.facebook) {
          return "http://graph.facebook.com/" + this._user.services.facebook.id + "/picture/?type=large";
        } else {
          let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: this._user });
          if (_lUserDetail) {
            let _lUserDetailImage: UserDetailImage = _lUserDetail.image;
            if (_lUserDetailImage) {
              return _lUserDetailImage.url;
            } else {
              return 'assets/img/user_default_image.png';
            }
          }
          else {
            return 'assets/img/user_default_image.png';
          }
        }
      } else {
        return 'assets/img/user_default_image.png';
      }
    } else {
      return 'assets/img/user_default_image.png';
    }
  }

  /**
   * This function show the confirm dialog to sign out from the app
   */
  showComfirmSignOut() {
    let btn_no = this.itemNameTraduction('MOBILE.SIGN_OUT.NO_BTN');
    let btn_yes = this.itemNameTraduction('MOBILE.SIGN_OUT.YES_BTN');
    let title = this.itemNameTraduction('MOBILE.SIGN_OUT.TITLE_CONFIRM');
    let content = this.itemNameTraduction('MOBILE.SIGN_OUT.CONTENT_CONFIRM');

    let prompt = this._alertCtrl.create({
      title: title,
      message: content,
      buttons: [
        {
          text: btn_no,
          handler: data => {
          }
        },
        {
          text: btn_yes,
          handler: data => {
            this.signOut();
          }
        }
      ]
    });
    prompt.present();
  }

  /**
 * User account sign out
 */
  signOut() {
    let loading_msg = this.itemNameTraduction('MOBILE.SIGN_OUT.LOADING');

    let loading = this._loadingCtrl.create({ content: loading_msg });
    loading.present();
    setTimeout(() => {
      loading.dismiss();
      Meteor.logout();
      if (this._userDetail.role_id === '400') {
        this._navCtrl.pop();
      }
      this._app.getRootNavs()[0].setRoot(InitialComponent);
    }, 1500);
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

  /**
   * This function allow translate strings
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
   * Remove all subscription
   */
  removeSubscriptions() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ionViewWillLeave() {
    this.disconnectSubscription.unsubscribe();
  }

  /**
   * ngOnDestroy implementation
   */
  ngOnDestroy() {
    this.removeSubscriptions();
  }

}
