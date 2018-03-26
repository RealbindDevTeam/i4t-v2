import { Component, NgZone, ViewContainerRef, OnInit } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { RecoverWebComponent } from '../recover-password/recover/recover.web.component';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { AuthClass } from '../auth.class';

@Component({
    selector: 'signin',
    templateUrl: './signin.web.component.html',
    styleUrls: ['../auth.component.scss']
})
export class SigninWebComponent extends AuthClass implements OnInit {

    private signinForm: FormGroup;
    private mdDialogRef2: MatDialogRef<any>;
    private error: string;

    /**
     * SigninWebComponent Constructor
     * @param {Router} router 
     * @param {NgZone} zone 
     * @param {TranslateService} translate 
     * @param {MatDialog} mdDialog 
     */
    constructor(protected router: Router,
        protected zone: NgZone,
        protected translate: TranslateService,
        protected _mdDialog: MatDialog) {

        super(router, zone, translate, _mdDialog);
        if (!Meteor.user()) {
            Meteor.logout();
        }
    }

    ngOnInit() {
        this.signinForm = new FormGroup({
            email: new FormControl('', [Validators.required]),
            password: new FormControl('', Validators.required)
        });
        this.error = '';
    }

    /**
     * This function login the user at the iurest system
     */
    login() {
        if (this.signinForm.valid) {
            Meteor.loginWithPassword(this.transformToLower(this.signinForm.value.email), this.signinForm.value.password, (err) => {
                let confirmMsg: string;
                this.zone.run(() => {
                    if (err) {
                        if (err.reason === 'User not found' || err.reason === 'Incorrect password') {
                            confirmMsg = 'SIGNIN.USER_PASS_INCORRECT';
                        } else {
                            confirmMsg = 'SIGNIN.ERROR';
                        }
                        this.openDialog(this.titleMsg, '', confirmMsg, '', this.btnAcceptLbl, false);
                    } else {
                        MeteorObservable.call('getRole').subscribe((role) => {
                            switch (role) {
                                case '100': {
                                    if (this.devicesValidate()) {
                                        this.insertUserInfo();
                                        this.router.navigate(['app/dashboard']);
                                    } else {
                                        this.router.navigate(['go-to-store', 'f'], { skipLocationChange: true });
                                        Meteor.logout();
                                    }
                                    break;
                                }
                                case '200': {
                                    this.validateUserIsActive('app/calls');
                                    break;
                                }
                                case '300': {
                                    this.validateUserIsActive('app/cashier-orders-today');
                                    break;
                                }
                                case '400': {
                                    this.router.navigate(['go-to-store', 't'], { skipLocationChange: true });
                                    Meteor.logout();
                                    break;
                                }
                                case '600': {
                                    if (this.devicesValidate()) {
                                        this.validateUserIsActive('app/dashboards');
                                    } else {
                                        this.router.navigate(['go-to-store', 'f'], { skipLocationChange: true });
                                    }
                                    break;
                                }
                            }
                        }, (error) => {
                            confirmMsg = 'SIGNIN.ERROR';
                            this.openDialog(this.titleMsg, '', confirmMsg, '', this.btnAcceptLbl, false);
                        });
                    }
                });
            });
        }
    }

    /**
     * Validate user is active
     * @param _pRoute 
     */
    validateUserIsActive(_pRoute: string) {
        MeteorObservable.call('validateEstablishmentIsActive').subscribe((_restaruantActive) => {
            if (_restaruantActive) {

                MeteorObservable.call('validateUserIsActive').subscribe((_active) => {
                    if (_active) {
                        this.insertUserInfo();
                        this.router.navigate([_pRoute]);
                    } else {
                        let confirmMsg = 'SIGNIN.USER_NO_ACTIVE';
                        this.openDialog(this.titleMsg, '', confirmMsg, '', this.btnAcceptLbl, false);
                    }
                });
            } else {
                let confirmMsg = 'SIGNIN.RESTAURANT_NO_ACTIVE';
                this.openDialog(this.titleMsg, '', confirmMsg, '', this.btnAcceptLbl, false);
            }
        });
    }

    /**
     * This function opens the forgot password dialog
     */
    openDialogForgotPassword() {
        this.mdDialogRef2 = this._mdDialog.open(RecoverWebComponent, {
            disableClose: true
        });
        this.mdDialogRef2.afterClosed().subscribe(result => {
            this.mdDialogRef2 = null;
        });
    }
}