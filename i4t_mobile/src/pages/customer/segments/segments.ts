import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';

@Component({
    templateUrl: 'segments.html'
})
export class SegmentsPage {
    private _option: string = 'orders';

    constructor(private _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider) {
        _translate.setDefaultLang('en');
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    }
}