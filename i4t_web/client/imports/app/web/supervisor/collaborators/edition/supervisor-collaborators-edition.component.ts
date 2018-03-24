import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { CustomValidators } from '../../../../../../../both/shared-components/validators/custom-validator';
import { Role } from '../../../../../../../both/models/auth/role.model';
import { Roles } from '../../../../../../../both/collections/auth/role.collection';
import { Table } from '../../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../../both/collections/establishment/table.collection';
import { UserProfile } from '../../../../../../../both/models/auth/user-profile.model';
import { UserDetails } from '../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../both/models/auth/user-detail.model';
import { User } from '../../../../../../../both/models/auth/user.model';
import { Users } from '../../../../../../../both/collections/auth/user.collection';
import { AlertConfirmComponent } from '../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'supervisor-collaborators-edition',
    templateUrl: './supervisor-collaborators-edition.component.html',
    providers: [UserLanguageService]
})
export class SupervisorCollaboratorsEditionComponent implements OnInit, OnDestroy {

    private _tableSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private _collaboratorEditionForm: FormGroup;
    private _mdDialogRef: MatDialogRef<any>;

    private _roles: Observable<Role[]>;
    private _tables: Observable<Table[]>;

    private _userProfile = new UserProfile();
    private selectUser: User;
    private selectUserDetail: UserDetail;

    private _tablesNumber: number[] = [];
    private _selectedIndex: number = 0;
    private _tableInit: number = 0;
    private _tableEnd: number = 0;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _userLang: string;
    private _error: string
    private _message: string;
    private _showConfirmError: boolean = false;
    private _showTablesSelect: boolean = false;
    private _disabledTablesAssignment: boolean = true;

    /**
     * CollaboratorsEditionComponent constructor
     * @param {Router} _router 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {NgZone} _zone 
     * @param {MatDialogRef<any>} _dialogRef 
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _router: Router,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _zone: NgZone,
        public _dialogRef: MatDialogRef<any>,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this.validateWaiterRole(this.selectUserDetail.role_id);
        this._collaboratorEditionForm = this._formBuilder.group({
            name: [this.selectUser.profile.first_name, [Validators.required, Validators.minLength(1), Validators.maxLength(70)]],
            last_name: [this.selectUser.profile.last_name, [Validators.required, Validators.minLength(1), Validators.maxLength(70)]],
            birthdate: [this.selectUserDetail.birthdate, [Validators.required]],
            role: [this.selectUserDetail.role_id],
            phone: [this.selectUserDetail.phone],
            username: [this.selectUser.username],
            email: [],
            password: [],
            confirmPassword: [],
            table_init: [this.selectUserDetail.table_assignment_init],
            table_end: [this.selectUserDetail.table_assignment_end],
            new_password: new FormControl('', [Validators.minLength(8), Validators.maxLength(20)]),
            confirm_new_password: new FormControl('', [Validators.minLength(8), Validators.maxLength(20)]),
        });
        this._tableInit = this.selectUserDetail.table_assignment_init;
        this._tableEnd = this.selectUserDetail.table_assignment_end;
        this._roles = Roles.find({}).zone();
        this._tableSub = MeteorObservable.subscribe('getTablesByEstablishmentWork', this.selectUser._id).takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Validate waiter role is select to enabled tables assignment
     * @param _roleId 
     */
    validateWaiterRole(_roleId: string) {
        if (_roleId === '200') {
            this._showTablesSelect = true;
        } else {
            this._showConfirmError = false;
            this._showTablesSelect = false;
            this._disabledTablesAssignment = true;
        }
    }

    /**
     * Enabled tables assignment
     * @param _pEvent 
     */
    pushSelectArray(_pEvent: any) {
        this._tablesNumber = [];
        if (_pEvent.checked) {
            this._disabledTablesAssignment = false;
            let tablesCount: number = 0;
            tablesCount = Tables.collection.find({}).count();
            for (var index = 1; index <= tablesCount; index++) {
                this._tablesNumber.push(index);
            }
        } else {
            this._disabledTablesAssignment = true;
        }
    }

    /**
     * This function validate date format
     */
    validateFormatDate() {
        let re = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    }

    /**
     * Collaborator update
     */
    updateUser() {
        if (Meteor.userId()) {
            if (this._collaboratorEditionForm.valid) {
                if (this._collaboratorEditionForm.valid) {

                    if (this._collaboratorEditionForm.value.role === '200') {

                        if (this._disabledTablesAssignment || (this._collaboratorEditionForm.value.table_init === 0 && this._collaboratorEditionForm.value.table_end === 0)) {
                            this._collaboratorEditionForm.value.table_end = Tables.collection.find({}).count();
                            if (this._collaboratorEditionForm.value.table_end > 0) {
                                this._collaboratorEditionForm.value.table_init = 1;
                            }
                        }
                        if (!this._disabledTablesAssignment && this._collaboratorEditionForm.value.table_end < this._collaboratorEditionForm.value.table_init) {
                            this._message = this.itemNameTraduction('COLLABORATORS_REGISTER.SELECT_RANGE_VALID_TABLES');
                            this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
                            return;
                        }
                    }

                    Users.update({ _id: this.selectUser._id }, {
                        $set: {
                            profile: {
                                first_name: this._collaboratorEditionForm.value.name,
                                last_name: this._collaboratorEditionForm.value.last_name,
                                language_code: this.selectUser.profile.language_code,
                                image: this.selectUser.profile.image
                            }
                        }
                    });
                    if (this._collaboratorEditionForm.value.role === '200') {
                        UserDetails.update({ _id: this.selectUserDetail._id }, {
                            $set: {
                                establishment_work: this.selectUserDetail.establishment_work,
                                birthdate: this._collaboratorEditionForm.value.birthdate,
                                phone: this._collaboratorEditionForm.value.phone,
                                table_assignment_init: Number.parseInt(this._collaboratorEditionForm.value.table_init.toString()),
                                table_assignment_end: Number.parseInt(this._collaboratorEditionForm.value.table_end.toString())
                            }
                        });
                    } else {
                        UserDetails.update({ _id: this.selectUserDetail._id }, {
                            $set: {
                                establishment_work: this.selectUserDetail.establishment_work,
                                birthdate: this._collaboratorEditionForm.value.birthdate,
                                phone: this._collaboratorEditionForm.value.phone
                            }
                        });
                    }
                    if (this._collaboratorEditionForm.value.new_password !== '' && this._collaboratorEditionForm.value.confirm_new_password !== '') {
                        if (this._collaboratorEditionForm.value.new_password !== this._collaboratorEditionForm.value.confirm_new_password) {
                            this._message = this.itemNameTraduction('SIGNUP.PASSWORD_NOT_MATCH');
                            this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
                        } else {
                            MeteorObservable.call('changeUserPassword', this.selectUser._id, this._collaboratorEditionForm.value.new_password).subscribe(() => {
                                this._dialogRef.close();
                                this._message = this.itemNameTraduction('COLLABORATORS_REGISTER.MESSAGE_COLLABORATOR_EDIT');
                                this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
                                this.cancel();
                            });
                        }
                    } else {
                        this._dialogRef.close();
                        this._message = this.itemNameTraduction('COLLABORATORS_REGISTER.MESSAGE_COLLABORATOR_EDIT');
                        this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
                        this.cancel();
                    }
                }
            } else {
                this._message = this.itemNameTraduction('COLLABORATORS_REGISTER.MESSAGE_FORM_INVALID');
                this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
            }
        } else {
            this._message = this.itemNameTraduction('COLLABORATORS_REGISTER.MESSAGE_NOT_LOGIN');
            this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
            return;
        }
    }

    /**
     * Form reset
     */
    cancel() {
        this._collaboratorEditionForm.controls['name'].reset();
        this._collaboratorEditionForm.controls['last_name'].reset();
        this._collaboratorEditionForm.controls['birthdate'].reset();
        this._collaboratorEditionForm.controls['phone'].reset();
        this._collaboratorEditionForm.controls['username'].reset();
        this._collaboratorEditionForm.controls['email'].reset();
        this._collaboratorEditionForm.controls['password'].reset();
        this._collaboratorEditionForm.controls['confirmPassword'].reset();

        this._router.navigate(['app/supervisor-collaborators']);
    }

    /**
     * This function allow translate strings
     * @param itemName 
     */
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

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}