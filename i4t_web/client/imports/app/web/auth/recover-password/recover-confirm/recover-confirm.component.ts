import { Component, NgZone, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'recover-confirm',
    templateUrl: './recover-confirm.component.html'
})

export class RecoverConfirmComponent implements OnInit, OnDestroy {

    private showCancelButton: boolean;


    constructor(public _dialogRef: MatDialogRef<any>,
        private _zone: NgZone,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private translate: TranslateService) {

        this.showCancelButton = data.showCancel;
        let userLang = navigator.language.split('-')[0];
        translate.setDefaultLang('en');
        translate.use(userLang);
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

