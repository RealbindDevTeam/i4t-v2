import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, ViewController } from 'ionic-angular';
import { Subscription, Observable, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { SettingsPage } from '../../options/settings/settings';
import { OrdersPage } from '../../orders/orders';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Parameter } from 'i4t_web/both/models/general/parameter.model';
import { Parameters } from 'i4t_web/both/collections/general/parameter.collection';


@Component({
    selector: 'popover-options',
    templateUrl: 'popover-options.html'
})

export class PopoverOptionsPage implements OnInit, OnDestroy {

    private _parameterSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    private _currentUserId: string;

    constructor(public _navCtrl: NavController,
        public viewCtrl: ViewController,
        private iab: InAppBrowser,
        public _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider, ) {
        _translate.setDefaultLang('en');
        this._currentUserId = Meteor.userId();
    }

    /**
    * ngOnInit implementation
    */
    ngOnInit() {
        this.removeSubscriptions();
        this.init();
    }

    init() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this._parameterSub = MeteorObservable.subscribe('getParameters').takeUntil(this.ngUnsubscribe).subscribe();
    }

    goToSettings() {
        this._navCtrl.push(SettingsPage);
        this.close();
    }

    goToTerms() {
        let param: Parameter = Parameters.findOne({ name: 'terms_url' });
        const browser = this.iab.create(param.value);
        this.close();
    }

    goToPolicy() {
        let param: Parameter = Parameters.findOne({ name: 'policy_url' });
        const browser = this.iab.create(param.value);
        this.close();
    }

    /**
    * ngOnDestroy Implementation
    */
    ngOnDestroy() {
        this.removeSubscriptions();
    }

    close() {
        this.viewCtrl.dismiss();
    }

    /**
    * Remove all subscriptions
    */
    removeSubscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}