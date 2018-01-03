import { Component, NgZone, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../services/general/user-language.service';

@Component({
    selector: 'alert-confirm',
    templateUrl: './alert-confirm.component.html',
    styleUrls: [ './alert-confirm.component.scss' ],
    providers: [UserLanguageService]
})
export class AlertConfirmComponent implements OnInit, OnDestroy {

    private showCancelButton: boolean;

    constructor(public _dialogRef: MatDialogRef<any>, private _zone: NgZone, @Inject(MAT_DIALOG_DATA) public data: any, private translate: TranslateService, private _userLanguageService: UserLanguageService, ) {
        this.showCancelButton = data.showCancel;
        if (Meteor.user()) {
            translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        } else {
            translate.use(this._userLanguageService.getNavigationLanguage());
        }
        translate.setDefaultLang('en');
    }

    ngOnInit() {
    }

    /**
     * Function that returns true to Parent component
     */
    closeConfirm() {
        this._dialogRef.close({ success: true });
    }

    /**
     * This function allow closed the modal dialog
     */
    cancel() {
        this._dialogRef.close({ success: false });
    }

    ngOnDestroy() {
    }
}