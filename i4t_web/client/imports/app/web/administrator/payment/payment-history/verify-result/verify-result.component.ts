import { Component, NgZone, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../../../services/general/user-language.service';

@Component({
    selector: 'verify-result-confirm',
    templateUrl: './verify-result.component.html',
    styleUrls: [ './verify-result.component.scss' ],
    providers: [ UserLanguageService ]
})
export class VerifyResultComponent implements OnInit, OnDestroy {

    /**
     * VerifyResultComponent Constructor
     * @param {MatDialogRef<any>} _dialogRef 
     * @param {NgZone} _zone 
     * @param {any} data 
     * @param {TranslateService} translate 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor( public _dialogRef: MatDialogRef<any>, 
                 private _zone: NgZone, 
                 @Inject(MAT_DIALOG_DATA) public data: any, 
                 private translate: TranslateService,
                 private _userLanguageService: UserLanguageService ) {
        translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
        translate.setDefaultLang( 'en' );
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

    ngOnInit() {

    }

    ngOnDestroy() {

    }

}