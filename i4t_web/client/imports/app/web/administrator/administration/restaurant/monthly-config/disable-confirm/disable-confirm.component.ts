import { Component, NgZone, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription } from 'rxjs';

@Component({
    selector: 'disable-confirm',
    templateUrl: './disable-confirm.component.html',
    styleUrls: [ './disable-confirm.component.scss' ]
})

export class DisableConfirmComponent {

    /**
     * DisableConfirmComponent constructor
     * @param {MatDialogRef<any>} _dialogRef
     */
    constructor(public _dialogRef: MatDialogRef<any>, private _zone: NgZone, @Inject(MAT_DIALOG_DATA) public data: any) {
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
}