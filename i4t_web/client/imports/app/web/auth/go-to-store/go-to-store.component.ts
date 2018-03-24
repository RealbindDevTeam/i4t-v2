import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../services/general/user-language.service';

@Component({
    selector: 'go-to-store',
    templateUrl: './go-to-store.component.html',
    styleUrls: ['./go-to-store.component.scss']
})

export class GoToStoreComponent implements OnInit, OnDestroy {

    private _subscription: any;
    private _userLang: string = "";
    private _ic: string = "";

    private auxClass: string = "";

    /**
     * GoToStoreComponent Constructor
     * @param {TranslateService} translate 
     * @param {UserLanguageService} _userLanguageService
     */
    public constructor(private _route: ActivatedRoute,
        private translate: TranslateService,
        public _userLanguageService: UserLanguageService) {

        this._route.params.forEach((params: Params) => {
            this._ic = params.ic;
            if (this._ic = 't') {
                this.auxClass = 'pagec';
            } else {
                this.auxClass = 'pagea';
            }
        });
        this._userLang = navigator.language.split('-')[0];
        translate.setDefaultLang('en');
        translate.use(this._userLang);
    }

    ngOnInit() {

    }

    ngOnDestroy() {
        if (this._subscription) { this._subscription.unsubscribe(); }
    }
}