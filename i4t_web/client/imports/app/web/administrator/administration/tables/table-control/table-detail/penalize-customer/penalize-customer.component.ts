import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MatDialogRef, MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../../../services/general/user-language.service';
import { User } from '../../../../../../../../../../both/models/auth/user.model';

@Component({
    selector: 'penalize-customer',
    templateUrl: './penalize-customer.component.html',
    styleUrls: ['./penalize-customer.component.scss'],
    providers: [UserLanguageService]
})
export class PenalizeCustomerComponent implements OnInit, OnDestroy {

    private _user: User;
    private _establishmentId: string;
    private _tableId: string;
    private _urlImage: string;
    private _tableNumber: string;
    private _showAccountError: boolean = false;
    private _showGeneralError: boolean = false;
    private _loading: boolean = false;


    /**
     * PenalizeCustomerComponent Constructor
     * @param {TranslateService} _translate
     * @param {UserLanguageService} _userLanguageService
     * @param {MatDialogRef<any>} _dialogRef
     * @param {MatSnackBar} _snackBar
     */
    constructor(private _translate: TranslateService,
        private _userLanguageService: UserLanguageService,
        public _dialogRef: MatDialogRef<any>,
        public _snackBar: MatSnackBar) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {

    }

    /**
     * Create customer penalization
     */
    penalizeCustomer(): void {
        this._loading = true;
        setTimeout(() => {
            MeteorObservable.call('penalizeCustomer', this._user).subscribe(() => {
                this._loading = false;
                this._showAccountError = false;
                this._showGeneralError = false;
                let _lMessage: string = this.itemNameTraduction('PENALIZE_CUSTOMER.PENALTY_CREATED');
                this._snackBar.open(_lMessage, '', { duration: 2500 });
                this.close();
            }, (error) => {
                if (error.error === '200') {
                    this._showAccountError = true;
                } else {
                    this._showGeneralError = true;
                }
            });
        }, 1500);
    }

    /**
     * Close penalize customer dialog
     */
    close(): void {
        this._dialogRef.close();
    }

    /**
     * Return traduction
     * @param {string} itemName 
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {

    }
}