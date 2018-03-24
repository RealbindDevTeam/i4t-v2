import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NavigationService } from '../navigation.service';
import { StringUtils } from '../../general/utils/string-utils';
import { UserLanguageService } from '../../services/general/user-language.service';
import { Users } from '../../../../../../both/collections/auth/user.collection';
import { User } from '../../../../../../both/models/auth/user.model';
import { UserDetail, UserDetailImage } from '../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';

@Component({
  selector: 'app-topnav',
  templateUrl: './topnav.component.html',
  styleUrls: ['./topnav.component.scss']
})
export class TopnavComponent implements OnInit, OnDestroy {

  private _subscriptions: Subscription[] = [];
  private _userSubscription: Subscription;
  private _userDetailSubscription: Subscription;

  private _sidenavOpenStyle: string;
  private _showSidenav: boolean;
  private _sidenavOpened: boolean;
  private _pageTitle: string;
  private _browserTitle: string;
  private _isLoadingRoute: boolean = false;
  private _breadcrumbs: Array<{ title: string, link: any[] | string }> = [];
  private _autoBreadcrumbs: boolean = true;
  private _searchToggled: boolean = false;
  private _showToggleSidenav: boolean = false;
  private _searchTerm: string = '';
  private _itemsTopMenu: string = '';

  private _breadcrumbInterval: number;
  private _pageTitleInterval: number;
  private _user: User;//Meteor.User;
  private _userName: string;

  private showMenuName: boolean = true;
  private menuName: string;
  private _userLang: string = "";
  private _showMenuButton: boolean;

  /**
   * TopnavComponent Constructor
   * @param {NavigationService} _navigation 
   * @param {Title} _title 
   * @param {Router} _router 
   * @param {TranslateService} _translate 
   * @param {UserLanguageService} _userLanguageService 
   * @param {NavigationService} _navigation
   */
  constructor(private _navigation: NavigationService,
    private _title: Title,
    private _router: Router,
    private _translate: TranslateService,
    private _userLanguageService: UserLanguageService,
    private _ngZone: NgZone) {
    this._userLang = navigator.language.split('-')[0];
    _translate.setDefaultLang('en');
    _translate.use(this._userLang);
  }

  ngOnInit() {
    this.removeSubscriptions();
    this._subscriptions.push(this._navigation.openSidenavStyle.subscribe(style => {
      this._sidenavOpenStyle = style;
    }));
    this._subscriptions.push(this._navigation.isRouteLoading.subscribe(isRouteLoading => {
      this._isLoadingRoute = isRouteLoading;
    }));
    this._subscriptions.push(this._navigation.sidenavOpened.subscribe(sidenavOpen => {
      this._sidenavOpened = sidenavOpen;
    }));
    this._subscriptions.push(this._navigation.menuItems.subscribe(items => {
      if (this._autoBreadcrumbs) {
        this.updateAutoBreadcrumbs();
      }
      this.updatePageTitle();
    }));
    this._subscriptions.push(this._navigation.breadcrumbs.subscribe(breadcrumbs => {
      if (breadcrumbs !== null) {
        window.clearInterval(this._breadcrumbInterval);
        this._autoBreadcrumbs = false;
        this._breadcrumbs = breadcrumbs;
      } else {
        if (this._isLoadingRoute) {
          this._breadcrumbInterval = window.setInterval(() => {
            if (!this._isLoadingRoute) {
              window.clearInterval(this._breadcrumbInterval);
              this.updateAutoBreadcrumbs();
            }
          });
        } else {
          this.updateAutoBreadcrumbs();
        }
      }
    }));
    this._subscriptions.push(this._navigation.pageTitle.subscribe(pageTitle => {
      if (pageTitle !== null) {
        window.clearInterval(this._pageTitleInterval);
        this._pageTitle = pageTitle;
        if (this._browserTitle === null) {
          this._title.setTitle(this._navigation.getAutoBrowserTitle(pageTitle));
        }
      } else {
        if (this._isLoadingRoute) {
          this._pageTitleInterval = window.setInterval(() => {
            if (!this._isLoadingRoute) {
              window.clearInterval(this._pageTitleInterval);
              this.updatePageTitle();
            }
          });
        } else {
          this.updatePageTitle();
        }
      }
    }));
    this._subscriptions.push(this._navigation.browserTitle.subscribe(browserTitle => {
      this._browserTitle = browserTitle;
      if (browserTitle !== null) {
        this._title.setTitle(browserTitle);
      } else {
        this._title.setTitle(this._navigation.getAutoBrowserTitle(this._pageTitle));
      }
    }));

    this._userSubscription = MeteorObservable.subscribe('getUserSettings').subscribe(() => {
      this._ngZone.run(() => {
        this._user = Users.collection.findOne({ _id: Meteor.userId() });
        if (this._user.username) {
          this._userName = this._user.username;
        }
        else if (this._user.profile.name) {
          this._userName = this._user.profile.name;
        }
        this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).subscribe();
      });
    });
    this._showToggleSidenav = true;
    this.showMenuName = false;
    this._showMenuButton = false;
  }

  /**
   * Change menu name 
   */
  getMenuName(event) {
    this.menuName = this.itemNameTraduction(event);
  }

  setMenuName(name: string) {
    this.menuName = this.itemNameTraduction(name);
  }

  /**
   * Return user image
   */
  getUserImage(): string {
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
   * Remove all subscriptions
   */
  removeSubscriptions(): void {
    this._subscriptions.forEach(sub => {
      if (sub) { sub.unsubscribe(); }
    });
    if (this._userSubscription) { this._userSubscription.unsubscribe(); }
    if (this._userDetailSubscription) { this._userDetailSubscription.unsubscribe() }
  }

  toggleSidenav() {
    this._navigation.setSidenavOpened(!this._sidenavOpened);
  }

  toggleSearch(input: HTMLInputElement) {
    this._searchToggled = !this._searchToggled;
    if (this._searchToggled) {
      window.setTimeout(() => {
        input.focus();
      }, 0);
    }
  }

  signOut() {
    Meteor.logout();
    this._router.navigate(['signin']);
  }

  private updateAutoBreadcrumbs() {
    this._navigation.currentRoute.take(1).subscribe(currentRoute => {
      this._autoBreadcrumbs = true;
      this._breadcrumbs = this._navigation.getAutoBreadcrumbs(currentRoute);
    });
  }

  private updatePageTitle() {
    this._navigation.currentRoute.take(1).subscribe(currentRoute => {
      this._pageTitle = this._navigation.getAutoPageTitle(currentRoute);
      if (this._pageTitle) {
        this._pageTitle = this.itemNameTraduction(this._pageTitle);
      }
      if (this._browserTitle === null) {
        this._title.setTitle(this._navigation.getAutoBrowserTitle(this._pageTitle));
      }
    });
  }

  /**
 * Return traduction
 * @param {string} itemName 
 */
  itemNameTraduction(itemName: string): string {
    var wordTraduced: string;
    this._translate.get(itemName).subscribe((res: string) => {
      wordTraduced = res;
    });
    return wordTraduced;
  }

  /**
   * ngOnDestroy Implementation
   */
  ngOnDestroy() {
    this.removeSubscriptions();
  }
}
