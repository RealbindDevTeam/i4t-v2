import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, PopoverController } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { Observable, Subscription, Subject } from 'rxjs';
import { Establishment } from 'i4t_web/both/models/establishment/establishment.model';
import { Establishments } from 'i4t_web/both/collections/establishment/establishment.collection';
import { Cities } from 'i4t_web/both/collections/general/city.collection';
import { EstablishmentListDetailPage } from "./establishment-list-detail/establishment-list-detail";
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';

@Component({
    templateUrl: 'establishment-list.html'
})
export class EstablishmentListPage implements OnInit, OnDestroy {

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishmentSubscription: Subscription;
    private _citySubscription: Subscription;

    private _establishments: Observable<Establishment[]>;

    constructor(public _translate: TranslateService,
        public _navCtrl: NavController,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageServiceProvider) {
        _translate.setDefaultLang('en');
    }

    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._establishmentSubscription = MeteorObservable.subscribe('getEstablishments', Meteor.userId()).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({}).zone();
            });
        });
        this._citySubscription = MeteorObservable.subscribe('cities').takeUntil(this.ngUnsubscribe).subscribe();
    }

    getCityName(_pIdCity: string): string {
        let city = Cities.findOne({ _id: _pIdCity });
        if (city) {
            return ", " + city.name;
        }
        return "";
    }

    /**
    * Go to establishment profile
    * @param _pEstablishment 
    */
    viewEstablishmentProfile(_pEstablishment: any) {
        this._navCtrl.push(EstablishmentListDetailPage, { establishment: _pEstablishment });
    }

    ngOnDestroy() {
        this.removeSubscriptions();
    }

    /**
   * Remove all subscriptions
   */
    removeSubscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}