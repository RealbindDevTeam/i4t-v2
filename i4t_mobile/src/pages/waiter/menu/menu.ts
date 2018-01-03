import { Component, ViewChild } from '@angular/core';
import { App, AlertController, LoadingController, Nav, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { SplashScreen } from '@ionic-native/splash-screen';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs';
import { InitialComponent } from '../../auth/initial/initial';
import { CallsPage } from '../calls/calls';
import { RestaurantMenuPage } from '../restaurant-menu/restaurant-menu';
import { SettingsPage } from '../../customer/options/settings/settings';
import { Users } from 'i4t_web/both/collections/auth/user.collection';
import { User } from 'i4t_web/both/models/auth/user.model';
import { UserDetail, UserDetailImage } from 'i4t_web/both/models/auth/user-detail.model';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';

@Component({
  templateUrl: 'menu.html'
})
export class Menu {
  @ViewChild(Nav) nav: Nav;
  private _userSubscription: Subscription;
  private _userDetailSubscription: Subscription;
  private _user: any;

  rootPage: any = CallsPage;

  pages: Array<{ icon: string, title: string, component: any }>;


  /**
   * Menu constructor
   * @param _app 
   * @param platform 
   * @param splashScreen 
   * @param _alertCtrl 
   * @param _loadingCtrl 
   * @param _translate 
   */
  constructor(public _app: App,
    public platform: Platform,
    public splashScreen: SplashScreen,
    public _alertCtrl: AlertController,
    public _loadingCtrl: LoadingController,
    private _translate: TranslateService) {
    this.initializeApp();
    this._user = Meteor.user();

    this.pages = [
      { icon: 'hand', title: 'MOBILE.WAITER_OPTIONS.CALLS', component: CallsPage },
      { icon: 'list-box', title: 'MOBILE.WAITER_OPTIONS.MENU', component: RestaurantMenuPage }
    ];

  }

  ngOnInit() {
    this.removeSubscriptions();
    this._userSubscription = MeteorObservable.subscribe('getUserSettings').subscribe();
    this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).subscribe();
  }

  /**
   * Okay, so the platform is ready and our plugins are available.
   * Here you can do any higher level native things you might need.
   */
  initializeApp() {
    this.splashScreen.hide();
  }

  /**
   * Function that allows show Signout comfirm dialog
   * @param { any } _call 
   */
  showComfirmSignOut(_call: any) {
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

    let loading = this._loadingCtrl.create({
      content: loading_msg
    });
    loading.present();
    setTimeout(() => {
      loading.dismiss();
      this._app.getRootNavs()[0].setRoot(InitialComponent);
      Meteor.logout();
    }, 1500);
  }

  /**
   * 
   * Reset the content nav to have just this page
   * we wouldn't want the back button to show in this scenario
   * @param page 
   */
  openPage(page) {
    this.nav.setRoot(page.component);
  }

  /**
   * Return user name
   */
  gerUserName(): string {
    let _lUser: User = Users.findOne({ _id: Meteor.userId() });
    if (_lUser) {
      return _lUser.username;
    }
    else {
      return 'Iurest';
    }
  }

  /**
   * Return user image
   */
  getUserImage(): string {
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

  /**
   * Open Settings Page
   */
  openSettings(): void {
    let _lSettings = this.itemNameTraduction('MOBILE.WAITER_OPTIONS.SETTINGS');
    let _lPage: any = { icon: 'assets/img/settings.png', title: _lSettings, component: SettingsPage };
    this.openPage(_lPage);
  }

  /**
   * This function allow translate strings
   * @param {string} _itemName 
   */
  itemNameTraduction(_itemName: string): string {
    var wordTraduced: string;
    this._translate.get(_itemName).subscribe((res: string) => {
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
  }

  ngOnDestroy() {
    this.removeSubscriptions();
  }
}
