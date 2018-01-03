import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material';
import { NavigationService } from '../navigation.service';
import { UserLanguageService } from '../../services/general/user-language.service';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { Menus } from '../../../../../../both/collections/auth/menu.collection';
import { Menu } from '../../../../../../both/models/auth/menu.model';
import { MenuItem } from '../menu-item';
import { TranslateService } from '@ngx-translate/core';
import { console } from 'meteor/tools';

@Component({
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild(MatSidenav) sideNav: MatSidenav;

  private sidenavStyle: string = 'side';
  private isHovering: boolean = false;
  private sidenavOpened: boolean = true;
  private _isHoveringNew: boolean = false;
  private _isHoveringTimeout: number;
  private _subscriptions: Subscription[] = [];

  menuItemSetup: MenuItem[];
  _userLang: string;

  /**
   * LayoutComponent constructor
   * @param {NavigationService} _navigation 
   * @param {TranslateService} _translate 
   * @param {UserLanguageService} _userLanguageService
   */
  constructor(private _navigation: NavigationService,
    private _translate: TranslateService,
    private _userLanguageService: UserLanguageService) {
    this._userLang = navigator.language.split('-')[0];
    _translate.setDefaultLang('en');
    _translate.use(this._userLang);
  }

  /**
   * ngOnDestroy Implementatio
   */
  ngOnDestroy() {
    this._subscriptions.forEach(sub => {
      if (sub) { sub.unsubscribe(); }
    });
  }

  /**
   * ngOnInit Implementation. Is validated user role to load layout corresponding
   */
  ngOnInit() {
    this.showSidenav();
  }

  /**
   * This method bundle the Sidenav functionality
   */
  showSidenav() {
    //alert(this._navigation.mediumScreenAndDown);
    if (this._navigation.mediumScreenAndDown) {
      this.sideNav.close();
      this.sidenavToggle(false);
    }

    let lastWindowSize: number = 0;
    let combined = Observable.combineLatest(this._navigation.sidenavOpened, this._navigation.openSidenavStyle, this._navigation.closedSidenavStyle, this._navigation.windowSize, (opened, openStyle, closedStyle, windowSize) => {
      let screenSizeChange: boolean = false;
      if (windowSize !== lastWindowSize) {
        lastWindowSize = windowSize;
        screenSizeChange = true;
      }
      return { opened, openStyle, closedStyle, screenSizeChange };
    });

    this._subscriptions.push(combined.subscribe((p: { opened: boolean, openStyle: string, closedStyle: string, screenSizeChange: boolean }) => {
      if (p.openStyle === 'off') {
        this.sidenavOpened = false;
        this.sidenavStyle = 'over';
        this.sideNav.close();
        return;
      }
      this.sidenavOpened = p.opened;
      if (this._navigation.largeScreen) {
        if (p.opened) {
          this.sidenavStyle = p.openStyle;
        } else {
          this.sidenavStyle = p.closedStyle;
        }
        if (this.sidenavStyle !== 'off' && (this.sidenavStyle !== 'hidden' || p.opened) && (this.sidenavStyle !== 'push' || p.opened)) {
          this.sideNav.open();
        } else {
          this.sideNav.close();
        }
      } else {
        this.sidenavStyle = 'over';
        if (p.opened && !p.screenSizeChange) {
          this.sideNav.open();
        } else {
          this.sideNav.close();
        }
      }
    }));
    if (this.sidenavStyle === 'hidden' || this.sidenavStyle === 'push') {
      this.sideNav.close(); // Close on initial load
    }

    this.menuItemSetup = [];

    MeteorObservable.call('getMenus').subscribe((param: Menu[]) => {
      for (let entry of param) {
        let menuItem = this.menuItems(entry);
        this.menuItemSetup.push(menuItem);
      }

    }, (error) => {
      alert(`Failed to to load menu ${error}`);
    });
    this._navigation.setMenuItems(this.menuItemSetup);
  }

  /**
   * This function allow creating the menu
   * @param _pMenuItem 
   */
  menuItems(_pMenuItem: any): MenuItem {
    let menuItem = new MenuItem({ title: _pMenuItem.name, link: _pMenuItem.url, icon: _pMenuItem.icon_name });
    if (_pMenuItem.children) {
      for (let _lMenuChildren of _pMenuItem.children) {
        let menuItemChild = this.menuItems(_lMenuChildren);
        menuItem.children.push(menuItemChild);
      }
    }
    return menuItem;
  }

  public get sidenavMode(): string {
    if (this.sidenavStyle === 'icon overlay' && this.isHovering) {
      return 'over';
    } else if (this.sidenavStyle === 'icon' || this.sidenavStyle === 'icon overlay') {
      return 'side';
    } else if (this.sidenavStyle === 'hidden') {
      return 'over';
    } else if (this.sidenavStyle === 'off') {
      return 'over';
    }
    return this.sidenavStyle;
  }

  private sidenavToggle(opened: boolean) {
    this._navigation.setSidenavOpened(opened);
  }

  toggleHover(isHovering: boolean) {
    this._isHoveringNew = isHovering;
    if (isHovering) {
      this.isHovering = true;
    } else if (this._isHoveringTimeout !== 0) {
      this._isHoveringTimeout = window.setTimeout(() => {
        this.isHovering = this._isHoveringNew;
      }, 50);
    }
  }

  itemNameTraduction(itemName: string): string {
    var wordTraduced: string;
    this._translate.get(itemName).subscribe((res: string) => {
      wordTraduced = res;
    });
    return wordTraduced;
  }

}