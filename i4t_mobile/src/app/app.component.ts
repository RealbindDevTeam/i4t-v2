import { Component } from '@angular/core';
import { AlertController, Platform, ToastController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Device } from '@ionic-native/device';
import { InitialComponent } from '../pages/auth/initial/initial';
import { HomeMenu } from '../pages/customer/home-menu/home-menu';
import { TabsPage } from '../pages/waiter/tabs/tabs';
import { UserLogin } from 'i4t_web/both/models/auth/user-login.model';
import { HomePage } from '../pages/customer/home/home';
import { Network } from '@ionic-native/network';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  private rootPage: any = null;
  private _userId: any;
  private _userLang: string;

  constructor(platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    public translate: TranslateService,
    public _alertCtrl: AlertController,
    private _device: Device,
    private _network: Network,
    private _toastCtrl: ToastController) {
    this._userId = Meteor.userId();
    this._userLang = navigator.language.split('-')[0];
    translate.setDefaultLang('en');
    translate.use(this._userLang);


    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      if (platform.is('cordova')) {
        statusBar.styleLightContent();
        splashScreen.hide();
      }

      if (this._userId) {
        MeteorObservable.call('getRole').subscribe((role) => {
          if (role == "400") {
            this.insertUserInfo();
            this.rootPage = HomePage;
          } else if (role == "200") {
            MeteorObservable.call('validateEstablishmentIsActive').subscribe((_restaruantActive) => {
              if (_restaruantActive) {
                MeteorObservable.call('validateUserIsActive').subscribe((active) => {
                  if (active) {
                    this.insertUserInfo();
                    this.rootPage = TabsPage;
                  } else {
                    this.rootPage = InitialComponent;
                    let contentMessage = this.itemNameTraduction("MOBILE.SIGNIN.USER_NO_ACTIVE");
                    this.showComfirm(contentMessage);
                    Meteor.logout();
                  }
                });
              } else {
                this.rootPage = InitialComponent;
                let confirmMsg = this.itemNameTraduction('MOBILE.SIGNIN.RESTAURANT_NO_ACTIVE');
                this.showComfirm(confirmMsg);
                Meteor.logout();
              }
            });
          }
        });
      } else {
        this.rootPage = InitialComponent;
      }
    });
  }

  itemNameTraduction(itemName: string): string {
    var wordTraduced: string;
    this.translate.get(itemName).subscribe((res: string) => {
      wordTraduced = res;
    });
    return wordTraduced;
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
}

