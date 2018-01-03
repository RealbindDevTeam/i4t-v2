import { Component, NgZone } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { MeteorObservable } from "meteor-rxjs";
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../../services/general/user-language.service';

@Component({
    selector: 'call-close-confirm',
    templateUrl: './call-close-confirm.component.html',
    styleUrls: ['./call-close-confirm.component.scss'],
    providers: [UserLanguageService]
})
export class CallCloseConfirmComponent {

    /**
     * CallCloseConfirmComponent constructor
     * @param {MatDialogRef<any>} _dialogRef 
     * @param {NgZone} _zone 
     * @param {TranslateService} _translate 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(public _dialogRef: MatDialogRef<any>,
        private _zone: NgZone,
        public _translate: TranslateService,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * Function that returns true to Parent component
     */
    closeWaiterCall() {
        this._dialogRef.close({ success: true });
    }

    /**
     * This function allow closed the modal dialog
     */
    cancel() {
        this._dialogRef.close({ success: false });
    }
}