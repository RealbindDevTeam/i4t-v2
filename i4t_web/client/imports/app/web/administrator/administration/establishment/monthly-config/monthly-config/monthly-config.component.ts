import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../../services/general/user-language.service';
import { Establishment } from '../../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../../both/collections/establishment/establishment.collection';
import { Parameter } from '../../../../../../../../../both/models/general/parameter.model';

@Component({
    selector: 'monthly-config',
    templateUrl: './monthly-config.component.html',
    styleUrls: ['./monthly-config.component.scss']
})
export class MonthlyConfigComponent implements OnInit, OnDestroy {

    private _establishments: Observable<Establishment[]>;
    private _establishmentSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private _showEstablishmentList: boolean = false;
    private _showEnableDisable: boolean = false;
    private _establishmentId: string = "";
    private _thereAreEstablishments: boolean = true;

    /**
     * MonthlyConfigComponent Constructor
     * @param {TranslateService} translate 
     * @param {Router} _router 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private translate: TranslateService,
        private _router: Router,
        private _userLanguageService: UserLanguageService,
        private _ngZone: NgZone) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentSub = MeteorObservable.subscribe('establishments', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({}).zone();
                this.countEstablishments();
                this._establishments.subscribe(() => { this.countEstablishments(); });
                if (this._establishments) {
                    this._showEstablishmentList = true;
                }
            });
        });
    }

    /**
     * Validate if establishments exists
     */
    countEstablishments(): void {
        Establishments.collection.find({}).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * This function go to enable disable component
     * @param {$event} event
     */
    goToEnableDisable(event) {
        this._establishmentId = event;
        this._showEnableDisable = true;
        this._showEstablishmentList = false;
    }

    /**
     * This function go to establishment list component
     * @param {$event} event
     */
    goToEstablishmentList(event) {
        this._showEnableDisable = false;
        this._showEstablishmentList = event;
    }

    goToAddEstablishment() {
        this._router.navigate(['/app/establishment-register']);
    }

    ngOnDestroy() {
        this.removeSubscriptions();
    }
}