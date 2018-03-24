import { Component, NgZone, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../../../../services/general/user-language.service';
import { Establishment } from '../../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../../both/collections/establishment/establishment.collection';
import { Item } from '../../../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../../../both/collections/menu/item.collection';

@Component({
    selector: 'enable-confirm',
    templateUrl: './enable-confirm.component.html',
    styleUrls: ['./enable-confirm.component.scss'],
    providers: [UserLanguageService]
})

export class EnableConfirmComponent implements OnInit, OnDestroy {

    private _establishmentSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public _dialogRef: MatDialogRef<any>,
        private _zone: NgZone,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private translate: TranslateService,
        private _userLanguageService: UserLanguageService,
        public snackBar: MatSnackBar) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentSub = MeteorObservable.subscribe('establishments', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => { });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /** 
     * Function to ge the establishments name
    */
    getEstablishmentName(_establishmentId: string): string {
        let establishment: Establishment = Establishments.findOne({ _id: _establishmentId });
        if (establishment) {
            return establishment.name;
        } else {
            return;
        }
    }

    /**
     * Function to update de item establishments avalaibility
     */
    updateAvailableFlag(_establishmentId: string) {
        let snackMsg: string = this.itemNameTraduction('ENABLE_DISABLED.AVAILABILITY_CHANGED');
        MeteorObservable.call('updateItemAvailable', _establishmentId, this.data.one._id).subscribe();
        this.snackBar.open(snackMsg, '', {
            duration: 1000,
        });
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

    /**
     * This function cleans the tables_number fields form
     * @param {string} itemName
     * @return {string}
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this.translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}

