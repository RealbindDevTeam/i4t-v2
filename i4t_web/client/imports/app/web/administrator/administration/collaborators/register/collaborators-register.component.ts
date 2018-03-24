import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { CustomValidators } from '../../../../../../../../both/shared-components/validators/custom-validator';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Role } from '../../../../../../../../both/models/auth/role.model';
import { Roles } from '../../../../../../../../both/collections/auth/role.collection';
import { Table } from '../../../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../../../both/collections/establishment/table.collection';
import { UserProfile } from '../../../../../../../../both/models/auth/user-profile.model';
import { UserDetails } from '../../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../../both/models/auth/user-detail.model';
import { Users } from '../../../../../../../../both/collections/auth/user.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'collaborators-register',
    templateUrl: './collaborators-register.component.html'
})
export class CollaboratorsRegisterComponent implements OnInit, OnDestroy {

    private _collaboratorRegisterForm: FormGroup;
    private _mdDialogRef: MatDialogRef<any>;
    private _establishmentSub: Subscription;
    private _roleSub: Subscription;
    private _tableSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishments: Observable<Establishment[]>;
    private _roles: Observable<Role[]>;
    private _tables: Observable<Table[]>;

    private _userProfile = new UserProfile();

    private _tablesNumber: number[] = [];
    public _selectedIndex: number = 0;
    private _userLang: string;
    private _error: string;
    private _message: string;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _userPrefix: string = '';
    private _selectedRol: string;
    private _showConfirmError: boolean = false;
    private _showTablesSelect: boolean = false;
    private _showTablesSelectByRest: boolean = false;
    private _disabledTablesAssignment: boolean = true;
    private _genderArray: any[] = [];

    /**
     * CollaboratorsRegisterComponent constructor
     * @param {Router} _router 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {NgZone} _zone 
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _router: Router,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _zone: NgZone,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this._userLang = this._userLanguageService.getNavigationLanguage();

        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._collaboratorRegisterForm = new FormGroup({
            //name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(70)]),
            //last_name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(70)]),
            birthdate: new FormControl('', [Validators.required]),
            establishment_work: new FormControl('', [Validators.required]),
            role: new FormControl('', [Validators.required]),
            phone: new FormControl('', [Validators.minLength(1), Validators.maxLength(40)]),
            username: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20), CustomValidators.noSpacesValidator]),
            email: new FormControl(''),
            password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
            confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
            table_init: new FormControl(0),
            table_end: new FormControl(0),
            gender: new FormControl('', [Validators.required]),
            fullName: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(50)])
        });
        this._establishments = Establishments.find({}).zone();
        this._establishmentSub = MeteorObservable.subscribe('establishments', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        this._roles = Roles.find({}).zone();
        this._roleSub = MeteorObservable.subscribe('getRoleCollaborators').takeUntil(this._ngUnsubscribe).subscribe();
        this._tableSub = MeteorObservable.subscribe('tables', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._tables = Tables.find({});
        });

        this._genderArray = [{ value: "SIGNUP.MALE_GENDER", label: "SIGNUP.MALE_GENDER" },
        { value: "SIGNUP.FEMALE_GENDER", label: "SIGNUP.FEMALE_GENDER" },
        { value: "SIGNUP.OTHER_GENDER", label: "SIGNUP.OTHER_GENDER" }];
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Validate establishmentId is select to enabled tables assignment
     * @param _pEstablishmentId 
     */
    validateEstablishmentSelection(_pEstablishmentId: string) {
        if (_pEstablishmentId) {
            this._showTablesSelectByRest = true;
        } else {
            this._showTablesSelectByRest = false;
        }
    }

    /**
     * Validate waiter role is select to enabled tables assignment
     * @param _roleId 
     */
    validateRole(_role: Role) {
        if (_role._id === '200') {
            this._showTablesSelect = true;
        } else {
            this._showConfirmError = false;
            this._showTablesSelect = false;
            this._disabledTablesAssignment = true;
        }
        if (_role.user_prefix !== undefined && _role.user_prefix !== null) {
            this._userPrefix = _role.user_prefix + '-';
            this._selectedRol = _role.name;
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
            tablesCount = Tables.collection.find({ establishment_id: this._collaboratorRegisterForm.value.establishment_work }).count();
            for (var index = 1; index <= tablesCount; index++) {
                this._tablesNumber.push(index);
            }
        } else {
            this._disabledTablesAssignment = true;
        }
    }

    /**
     * This function validate Register form
     * @param _index 
     */
    canMove(_index: number): boolean {
        switch (_index) {
            case 0:
                return true;
            case 1:
                if (this._collaboratorRegisterForm.controls['fullName'].valid
                    && this._collaboratorRegisterForm.controls['establishment_work'].valid
                    && this._collaboratorRegisterForm.controls['role'].valid
                    && this._collaboratorRegisterForm.controls['birthdate'].valid) {
                    return true;
                } else {
                    return false;
                }
            default:
                return true;
        }
    }

    /**
     * Validate Form date
     */
    validateFormatDate() {
        let re = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    }

    /**
     * Show next page of the wizard
     */
    next(): void {
        if (this.canMove(this._selectedIndex + 1)) {
            this._selectedIndex++;
        }
    }

    /**
     * Previous page of the wizard
     */
    previous(): void {
        if (this._selectedIndex === 0) {
            return;
        }
        if (this.canMove(this._selectedIndex - 1)) {
            this._selectedIndex--;
        }
    }

    /**
     * Form register collaborator
     */
    register() {
        if (Meteor.userId()) {
            if (this._collaboratorRegisterForm.valid) {
                if (this._collaboratorRegisterForm.value.password == this._collaboratorRegisterForm.value.confirmPassword) {
                    //this._userProfile.first_name = this._collaboratorRegisterForm.value.name;
                    //this._userProfile.last_name = this._collaboratorRegisterForm.value.last_name;
                    this._userProfile.full_name = this._collaboratorRegisterForm.value.fullName;
                    this._userProfile.language_code = this._userLang;
                    this._userProfile.gender = this._collaboratorRegisterForm.value.gender;

                    if (this._collaboratorRegisterForm.valid) {

                        if (this._collaboratorRegisterForm.value.role === '200') {
                            if (this._disabledTablesAssignment || (this._collaboratorRegisterForm.value.table_init === 0 && this._collaboratorRegisterForm.value.table_end === 0)) {
                                this._collaboratorRegisterForm.value.table_end = Tables.collection.find({ establishment_id: this._collaboratorRegisterForm.value.establishment_work }).count();
                                if (this._collaboratorRegisterForm.value.table_end > 0) {
                                    this._collaboratorRegisterForm.value.table_init = 1;
                                }
                            }
                            if (!this._disabledTablesAssignment && this._collaboratorRegisterForm.value.table_end < this._collaboratorRegisterForm.value.table_init) {
                                this._message = this.itemNameTraduction('COLLABORATORS_REGISTER.SELECT_RANGE_VALID_TABLES');
                                this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
                                return;
                            }
                        }

                        let info: any = ({
                            "email": this._collaboratorRegisterForm.value.email,
                            "password": this._collaboratorRegisterForm.value.password,
                            "username": this._userPrefix + this._collaboratorRegisterForm.value.username,
                            "profile": this._userProfile
                        });

                        MeteorObservable.call('createCollaboratorUser', info).subscribe((result) => {
                            var id_detail: string;
                            if (this._collaboratorRegisterForm.value.role === '200') {
                                id_detail = UserDetails.collection.insert({
                                    user_id: result.toString(),
                                    role_id: this._collaboratorRegisterForm.value.role,
                                    is_active: true,
                                    establishment_work: this._collaboratorRegisterForm.value.establishment_work,
                                    jobs: 0,
                                    birthdate: this._collaboratorRegisterForm.value.birthdate,
                                    phone: this._collaboratorRegisterForm.value.phone,
                                    enabled: true,
                                    table_assignment_init: Number.parseInt(this._collaboratorRegisterForm.value.table_init),
                                    table_assignment_end: Number.parseInt(this._collaboratorRegisterForm.value.table_end),
                                });
                            } else {
                                id_detail = UserDetails.collection.insert({
                                    user_id: result.toString(),
                                    role_id: this._collaboratorRegisterForm.value.role,
                                    is_active: true,
                                    establishment_work: this._collaboratorRegisterForm.value.establishment_work,
                                    jobs: 0,
                                    birthdate: new Date("<" + this._collaboratorRegisterForm.value.birthdate_yyyy + "-" +
                                        this._collaboratorRegisterForm.value.birthdate_mm + "-" +
                                        this._collaboratorRegisterForm.value.birthdate_dd + ">"),
                                    phone: this._collaboratorRegisterForm.value.phone,
                                    enabled: true,
                                });
                            }

                            if (id_detail) {
                                this._message = this.itemNameTraduction('COLLABORATORS_REGISTER.MESSAGE_COLLABORATOR');
                                this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
                                this.cancel();
                            }
                            else {
                                this._message = this.itemNameTraduction('COLLABORATORS_REGISTER.ERROR_INSERT');
                                this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
                            }
                        }, (error) => {
                            if (error.error === 403) {
                                this._message = this.itemNameTraduction('COLLABORATORS_REGISTER.USER_EXISTS');
                                this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
                            } else {
                                this.openDialog(this.titleMsg, '', error.reason, '', this.btnAcceptLbl, false);
                            }
                        });

                    }
                } else {
                    this._message = this.itemNameTraduction('SIGNUP.PASSWORD_NOT_MATCH');
                    this.openDialog(this.titleMsg, '', this._message, '', this.btnAcceptLbl, false);
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
     * Reset register form
     */
    cancel() {
        this._collaboratorRegisterForm.controls['fullName'].reset();
        this._collaboratorRegisterForm.controls['birthdate'].reset();
        this._collaboratorRegisterForm.controls['establishment_work'].reset();
        this._collaboratorRegisterForm.controls['phone'].reset();
        this._collaboratorRegisterForm.controls['username'].reset();
        this._collaboratorRegisterForm.controls['email'].reset();
        this._collaboratorRegisterForm.controls['password'].reset();
        this._collaboratorRegisterForm.controls['confirmPassword'].reset();

        this._router.navigate(['app/collaborators']);
    }

    /**
     * This function allow translate
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
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }

}