import { Component, OnInit, NgZone } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { MeteorObservable } from 'meteor-rxjs';
import { CustomValidators } from '../../../../../../../both/shared-components/validators/custom-validator';
import { AlertConfirmComponent } from '../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'change-email',
    templateUrl: './change-email.web.component.html',
    styleUrls: [],
    providers: [UserLanguageService]
})
export class ChangeEmailWebComponent implements OnInit {

    private _mdDialogRef: MatDialogRef<any>;
    private _emailEditForm: FormGroup;
    private _error: string;
    private titleMsg: string;
    private btnAcceptLbl: string;

    /**
     * ChangeEmailWebComponent Constructor
     * @param {MatDialogRef<any>} _dialogRef 
     * @param {NgZone} _zone 
     * @param {TranslateService} _translate 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(public _dialogRef: MatDialogRef<any>,
        private _zone: NgZone,
        private _translate: TranslateService,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    ngOnInit() {
        this._emailEditForm = new FormGroup({
            email: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(40), CustomValidators.emailValidator]),
            password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
            new_email: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(40), CustomValidators.emailValidator]),
            confirm_new_email: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(40), CustomValidators.emailValidator]),
        });
        this._error = '';
    }

    changeEmail(): void {
        let user = Meteor.user();
        let message: string;
        let resp: boolean;
        if (this._emailEditForm.valid) {
            resp = this.confirmUser();
        } else {
            this.showAlert('SETTINGS.ERROR_EMAIL_NOT_UPDATE');
            return;
        }

        if (resp || this._emailEditForm.value.email !== user.emails[0].address) {
            this.showAlert('SETTINGS.ERROR_EMAIL_DOES_NOT_MATCH');
        } else if (this._emailEditForm.value.new_email !== this._emailEditForm.value.confirm_new_email) {
            this.showAlert('SETTINGS.ERROR_EMAILS_DOES_NOT_MATCH');
        } else {
            this._zone.run(() => {
                MeteorObservable.call('addEmail', this._emailEditForm.value.new_email).subscribe(() => {
                }, (error) => {
                    this.showError(error);
                    return;
                });

                MeteorObservable.call('removeEmail', this._emailEditForm.value.email).subscribe(() => {
                    this.showAlert('SETTINGS.MESSAGE_EMAIL_UPDATED');
                    this.cancel();
                }, (error) => {
                    this.showError(error);
                });
            });
        }
    }

    confirmUser(): boolean {
        let resp: boolean;
        Meteor.loginWithPassword(this._emailEditForm.value.email, this._emailEditForm.value.password, function (error) {
            if (error) {
                this.showError(error);
                resp = false;
            }
            else {
                resp = true;
            }
        });
        return resp;
    }

    cancel() {
        this._dialogRef.close({ success: false });
    }

    showAlert(message: string) {
        let message_translate = this.itemNameTraduction(message);
        this.openDialog(this.titleMsg, '', message, '', this.btnAcceptLbl, false);
    }

    showError(error: string) {
        let error_translate = this.itemNameTraduction(error);
        this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
    }

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
    * This function open de error dialog according to parameters 
    * @param {string} title
    * @param {string} subtitle
    * @param {string} content
    * @param {string} btnCancelLbl
    * @param {string} btnAcceptLbl
    * @param {boolean} showBtnCancel
    */
    openDialog(title: string, subtitle: string, content: string, btnCancelLbl: string, btnAcceptLbl: string, showBtnCancel: boolean) {

        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: title,
                subtitle: subtitle,
                content: content,
                buttonCancel: btnCancelLbl,
                buttonAccept: btnAcceptLbl,
                showBtnCancel: showBtnCancel
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {

            }
        });
    }
}