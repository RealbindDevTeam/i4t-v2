import { Meteor } from 'meteor/meteor';
import { Router } from '@angular/router';
import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material';
import { MeteorObservable } from 'meteor-rxjs';
import { UserDetails } from '../../../../../both/collections/auth/user-detail.collection';
import { UserLogin  } from '../../../../../both/models/auth/user-login.model';
import { AlertConfirmComponent } from '../../web/general/alert-confirm/alert-confirm.component';

export class AuthClass {

    protected userLang: string;
    protected _mdDialogRef: MatDialogRef<any>;
    protected titleMsg: string;
    protected btnAcceptLbl: string;

    /**
     * SignupWebComponent Constructor
     * @param {Router} router 
     * @param {NgZone} zone
     * @param {TranslateService} translate 
     * @param {MdDialog} _mdDialog
     */
    constructor(protected router: Router,
        protected zone: NgZone,
        protected translate: TranslateService,
        protected _mdDialog: MatDialog) {

        this.userLang = navigator.language.split('-')[0];
        translate.setDefaultLang('en');
        translate.use(this.userLang);

        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * This function creates an iurest user with facebook info
     */
    loginWithFacebook() {
        Meteor.loginWithFacebook({ requestPermissions: ['public_profile', 'email'] }, (err) => {
            let error: string;
            error = 'SIGNUP.ERROR';
            this.zone.run(() => {
                if (err) {
                    this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
                } else {
                    this.insertUserDetail();
                }
            });
        });
    }

    /**
     * This function creates an iurest user with twitter info
     */
    loginWithTwitter() {
        let respLogin = this.devicesValidate();
        if (respLogin) {
            Meteor.loginWithTwitter({ requestPermissions: [] }, (err) => {
                this.zone.run(() => {
                    if (err) {
                        //this.error = err;
                    } else {
                        this.insertUserDetail();
                    }
                });
            });
        }
        else {
            this.router.navigate(['go-to-store']);
        }
    }

    /**
     * This function creates an iurest user with google info
     */
    loginWithGoogle() {
        let respLogin = this.devicesValidate();
        if (respLogin) {
            Meteor.loginWithGoogle({ requestPermissions: [] }, (err) => {
                this.zone.run(() => {
                    if (err) {
                        //this.error = err;
                    } else {
                        this.insertUserDetail();
                    }
                });
            });
        }
        else {
            this.router.navigate(['go-to-store']);
        }
    }

    /**
     * This function insert de user data 
     */
    insertUserDetail() {
        MeteorObservable.call('getDetailsCount').subscribe((count) => {
            if (count === 0) {
                UserDetails.insert({
                    user_id: Meteor.userId(),
                    role_id: '400',
                    is_active: true,
                    penalties: [],
                    grant_start_points: true,
                    current_establishment: '',
                    current_table: ''
                });
            }
            this.insertUserInfo();
            this.router.navigate(['app/orders']);
        }, (error) => {
            //this.error;
        });
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

    /**
     * This function validate de devices and return boolean
     * @return {boolean}
     */
    devicesValidate(): boolean {
        if (navigator.userAgent.match(/Android/i)
            || navigator.userAgent.match(/webOS/i)
            || navigator.userAgent.match(/iPhone/i)
            || navigator.userAgent.match(/iPad/i)
            || navigator.userAgent.match(/iPod/i)
            || navigator.userAgent.match(/BlackBerry/i)
            || navigator.userAgent.match(/Windows Phone/i)) {
            return false;
        } else {
            return true
        }
    }

    /**
     * This function returns de user lang
     * @return {string}
     */
    getUserLang(): string {
        return this.userLang;
    }

    /**
     * This function transform to lowercase a string
    */
    transformToLower(_word: string): string {
        return _word.toLowerCase();
    }

    /**
     * Insert User Info
     */
    insertUserInfo(): void {
        let _lUserLogin: UserLogin = new UserLogin();
        _lUserLogin.user_id = Meteor.userId();
        _lUserLogin.login_date = new Date();
        _lUserLogin.app_code_name = navigator.appCodeName;
        _lUserLogin.app_name = navigator.appName;
        _lUserLogin.app_version = navigator.appVersion;
        _lUserLogin.cookie_enabled = navigator.cookieEnabled;
        _lUserLogin.language = navigator.language;
        _lUserLogin.platform = navigator.platform;
        MeteorObservable.call('insertUserLoginInfo', _lUserLogin).subscribe();
    }
}