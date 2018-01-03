import { Component, NgZone, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../../../services/general/user-language.service';

@Component({
    selector: 'transaction-response-confirm',
    templateUrl: './trn-response-confirm.component.html',
    styleUrls: [ './trn-response-confirm.component.scss' ],
    providers: [ UserLanguageService ]
})
export class TrnResponseConfirmComponent implements OnInit, OnDestroy {

    private showCancelButton: boolean;

    /**
     * TrnResponseConfirmComponent Constructor
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

        this.showCancelButton = data.showCancel;
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