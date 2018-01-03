import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CustomValidators } from '../../../../../../both/shared-components/validators/custom-validator';
import { AlertConfirmComponent } from '../../general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'reset-password',
    templateUrl: './reset-password.web.component.html',
    styleUrls: [ '../auth.component.scss' ]
})
export class ResetPasswordWebComponent {

    private _mdDialogRef: MatDialogRef<any>;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private resetPasswordForm: FormGroup;
    private userLang: string;
    private tokenId: string;
    private showConfirmError: boolean = false;

    /**
     * ResetPasswordWebComponent Component
     * @param {Router} router 
     * @param {NgZone} zone 
     * @param {TranslateService} translate 
     * @param {ActivatedRoute} activatedRoute
     */
    constructor(protected router: Router,
        protected zone: NgZone,
        protected translate: TranslateService,
        protected activatedRoute: ActivatedRoute,
        protected _mdDialog: MatDialog) {

        let userLang = navigator.language.split('-')[0];
        translate.setDefaultLang('en');
        translate.use(userLang);

        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }


    ngOnInit() {

        this.activatedRoute.params.forEach((params: Params) => {
            this.tokenId = params['tk'];
        });

        this.resetPasswordForm = new FormGroup({
            password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
            confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)])
        });
    }

    resetPassword() {

        if (this.resetPasswordForm.valid) {
            if (this.resetPasswordForm.value.password == this.resetPasswordForm.value.confirmPassword) {
                Accounts.resetPassword(
                    this.tokenId,
                    this.resetPasswordForm.value.password,
                    (err) => {
                        this.zone.run(() => {
                            if (err) {
                                //this.error = err;
                                this.showError(err);
                            } else {
                                this.showAlert('RESET_PASWORD.SUCCESS');
                            }
                        });
                    });

            } else {
                this.showConfirmError = true;
            }
        }
    }

    showAlert(message: string) {
        let message_translate = this.itemNameTraduction(message);
        this.openDialog(this.titleMsg, '', message_translate, '', this.btnAcceptLbl, false);
        Meteor.logout();
        this.router.navigate(['signin']);
    }

    showError(error: string) {
        this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
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

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this.translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }
}