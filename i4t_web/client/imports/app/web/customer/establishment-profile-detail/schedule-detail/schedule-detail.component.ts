import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { TranslateService } from '@ngx-translate/core';
import { EstablishmentProfile } from '../../../../../../../both/models/establishment/establishment.model';

@Component({
    selector: 'resturant-schedule',
    templateUrl: './schedule-detail.component.html',
    styleUrls: [ './schedule-detail.component.scss' ],
    providers: [ UserLanguageService ]
})
export class ScheduleDetailComponent {

    public _establishmentSchedule: EstablishmentProfile;

    /**
     * ScheduleDetailComponent constructor
     * @param {MatDialogRef<any>} _dialogRef
     * @param {TranslateService} _translate
     * @param {UserLanguageService} _userLanguageService
     */
    constructor( public _dialogRef: MatDialogRef<any>,
                 private _translate: TranslateService,
                 private _userLanguageService: UserLanguageService) {
        if( Meteor.user() !== undefined && Meteor.user() !== null ){
            _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
            _translate.setDefaultLang('en');
        } else {
            _translate.use( navigator.language.split('-')[0] );
            _translate.setDefaultLang('en');
        }
    }
}