import { Component, NgZone, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../../../services/general/user-language.service';

@Component({
    selector: 'cc-payment-confirm',
    templateUrl: './cc-payment-confirm.component.html',
    styleUrls: [ './cc-payment-confirm.component.scss' ],
    providers: [UserLanguageService]
})
export class CcPaymentConfirmComponent implements OnInit, OnDestroy {

    private _cardNumber: string;

    /**
     * CcPaymentConfirmComponent Constructor
     * @param {MatDialogRef<any>} _dialogRef 
     * @param {NgZone} _zone 
     * @param {any} data 
     * @param {TranslateService} translate 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(public _dialogRef: MatDialogRef<any>,
        private _zone: NgZone,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private translate: TranslateService,
        private _userLanguageService: UserLanguageService) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
        
        this._cardNumber = data.cardnumber.substring(data.cardnumber.length - 4);
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