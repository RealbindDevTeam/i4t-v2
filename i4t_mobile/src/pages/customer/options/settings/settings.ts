import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { App, LoadingController, ModalController, NavController, NavParams, ToastController, AlertController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs';

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

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage implements OnInit, OnDestroy {

  private _userSubscription: Subscription;
  private _userDetailSubscription: Subscription;
  private _languagesSubscription: Subscription;
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
    private _ngZone: NgZone) {
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
    this.init();
  }

  init() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));

    this.removeSubscriptions();

    this._userSubscription = MeteorObservable.subscribe('getUserSettings').subscribe();

    this._languagesSubscription = MeteorObservable.subscribe('languages').subscribe(() => {
      this._ngZone.run(() => {
        this._languages = Languages.find({}).zone();
      });
    });


    this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).subscribe(() => {
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
          this._userForm = this.formBuilder.group({
            username: new FormControl({ value: this._user.username, disabled: !controlsDisabled }),
            language_code: new FormControl({ value: this._user.profile.language_code, disabled: controlsDisabled })
          });

          this._validateChangePass = false;

          if (this._userDetail.role_id === '400') {
            this._validateChangeEmail = false;
          } else {
            controlsDisabled = true
          }

          let first_name: FormControl = new FormControl({ value: this._user.profile.first_name, disabled: controlsDisabled });
          this._userForm.addControl('first_name', first_name);

          let last_name: FormControl = new FormControl({ value: this._user.profile.last_name, disabled: controlsDisabled });
          this._userForm.addControl('last_name', last_name);
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
                  first_name: this._userForm.value.first_name,
                  last_name: this._userForm.value.last_name,
                  language_code: this._userForm.value.language_code
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
    if (this._user.services && this._user.services.facebook) {
      return "https://graph.facebook.com/" + this._user.services.facebook.id + "/picture/?type=large";
    } else {
      let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: Meteor.userId() });
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
      this._navCtrl.pop();
      this._app.getRootNavs()[0].setRoot(InitialComponent);
      Meteor.logout();
    }, 1500);
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
    if (this._userSubscription) { this._userSubscription.unsubscribe(); }
    if (this._userDetailSubscription) { this._userDetailSubscription.unsubscribe(); }
    if (this._languagesSubscription) { this._languagesSubscription.unsubscribe(); }
  }

  /**
   * ngOnDestroy implementation
   */
  ngOnDestroy() {
    this.removeSubscriptions();
  }

}
