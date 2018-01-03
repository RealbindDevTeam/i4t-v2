import { Component, ViewContainerRef, OnInit, NgZone } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Accounts } from 'meteor/accounts-base';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { AlertConfirmComponent } from '../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'change-password',
    templateUrl: './change-password.web.component.html',
    providers: [UserLanguageService]
})
export class ChangePasswordWebComponent implements OnInit {

    private _changePasswordForm: FormGroup;
    private _user: Meteor.User;
    private _mdDialogRef: MatDialogRef<any>;
    private _error: string;
    private titleMsg: string;
    private btnAcceptLbl: string;

    /**
     * ChangePasswordWebComponent Constructor
     * @param {MatDialogRef<any>} _dialogRef 
     * @param {NgZone} _zone 
     * @param {TranslateService} _translate 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(public _dialogRef: MatDialogRef<any>,
        private _zone: NgZone,
        protected _translate: TranslateService,
        protected _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    ngOnInit() {
        this._changePasswordForm = new FormGroup({
            old_password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
            new_password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
            confirm_new_password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
        });
        this._error = '';
    }

    changePassword() {
        if (this._changePasswordForm.valid) {
            if (this._changePasswordForm.value.new_password !== this._changePasswordForm.value.confirm_new_password) {
                this.showAlert('SETTINGS.ERROR_PASS_NOT_UPDATE');
            } else {
                this._zone.run(() => {
                    Accounts.changePassword(this._changePasswordForm.value.old_password, this._changePasswordForm.value.new_password, (err) => {
                        if (err) {
                            this.showError(err);
                        } else {
                            this.showAlert('SETTINGS.MESSAGE_PASS_UPDATED');
                            this.cancel();
                        }
                    });
                });
            }
        }
        else {
            this.showAlert('SETTINGS.ERROR_PASS_NOT_UPDATE');
        }
    }

    cancel() {
        this._dialogRef.close({ success: false });
    }

    showAlert(message: string) {
        let message_translate = this.itemNameTraduction(message);
        this.openDialog(this.titleMsg, '', message_translate, '', this.btnAcceptLbl, false);
    }

    showError(error: string) {
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