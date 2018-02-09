import { Component, NgZone, ViewContainerRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../services/general/user-language.service';

@Component({
    selector: 'notfound',
    templateUrl: './notfound.web.component.html',
    styleUrls: [ './notfound.web.component.scss' ]
})
export class NotFoundWebComponent {

    private userLang: string;

    /**
     * NotFoundWebComponent Constructor
     * @param {NgZone} zone 
     * @param {TranslateService} translate
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor( protected zone: NgZone, 
                 protected translate: TranslateService, 
                 protected _userLanguageService: UserLanguageService ) {
        translate.use( this._userLanguageService.getNavigationLanguage() );
        translate.setDefaultLang( 'en' );
    }
}