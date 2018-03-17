import { Component, Inject, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Observable, Subscription, Subject } from 'rxjs';
import { UserLanguageService } from '../../../../../services/general/user-language.service';
import { Establishment } from "../../../../../../../../../both/models/establishment/establishment.model";
import { Establishments } from "../../../../../../../../../both/collections/establishment/establishment.collection";
import { Items } from 'both/collections/menu/item.collection';

@Component({
    selector: 'recommended',
    templateUrl: './recommended.component.html',
    styleUrls: ['./recommended.component.scss'],
    providers: [UserLanguageService]
})
export class Recommended implements OnInit, OnDestroy {

    private _establishmentSubscription: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    /**
     * Recommended constructor
     * @param translate 
     * @param _userLanguageService 
     * @param snackBar 
     * @param _dialogRef 
     * @param data 
     */
    constructor(private translate: TranslateService,
        private _userLanguageService: UserLanguageService,
        public snackBar: MatSnackBar,
        public _dialogRef: MatDialogRef<any>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentSubscription = MeteorObservable.subscribe('establishments', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => { });
    }

    /** 
     * Function to ge the Establishment name
    */
    getEstablishmentName(_pEstablishmentId: string): string {
        let establishment: Establishment = Establishments.findOne({ _id: _pEstablishmentId });
        if (establishment) {
            return establishment.name;
        } else {
            return;
        }
    }

    /**
     * Function that returns true to Parent component
     */
    close() {
        this._dialogRef.close({ success: true });
    }

    /**
     * Function to update de item establishments recommendation
     */
    updateRecommendedFlag(_establishmentId: string) {
        let snackMsg: string = this.itemNameTraduction('ITEMS.RECOMMENDED_CHANGED');
        MeteorObservable.call('updateRecommended', _establishmentId, this.data.item._id).subscribe();
        this.snackBar.open(snackMsg, '', {
            duration: 1000,
        });
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
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    ngOnDestroy() {

    }

}