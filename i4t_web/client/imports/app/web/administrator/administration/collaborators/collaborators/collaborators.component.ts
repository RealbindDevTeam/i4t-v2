import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef, MatDialog } from '@angular/material';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Role } from '../../../../../../../../both/models/auth/role.model';
import { Roles } from '../../../../../../../../both/collections/auth/role.collection';
import { UserDetail } from '../../../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../../../both/collections/auth/user-detail.collection';
import { User } from '../../../../../../../../both/models/auth/user.model';
import { Users } from '../../../../../../../../both/collections/auth/user.collection';
import { CollaboratorsEditionComponent } from '../edition/collaborators-edition.component';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'collaborators',
    templateUrl: './collaborators.component.html',
    styleUrls: ['./collaborators.component.scss']
})
export class CollaboratorsComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _establishments: Observable<Establishment[]>;
    private _userDetails: Observable<UserDetail[]>;
    private _users: Observable<User[]>;
    private _roles: Observable<Role[]>;

    private _establishmentSub: Subscription;
    private _userDetailsSub: Subscription;
    private _roleSub: Subscription;
    private _usersSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    //private _form                   : FormGroup;
    public _dialogRef: MatDialogRef<any>;
    private _mdDialogRef: MatDialogRef<any>;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _thereAreEstablishments: boolean = true;

    /**
     * CollaboratorsComponent Constructor
     * @param {Router} _router 
     * @param {TranslateService} _translate 
     * @param {MatDialog} _dialog 
     * @param {UserLanguageService} _userLanguageService 
     * @param {NgZone} _ngZone
     */
    constructor(private _router: Router,
        private _translate: TranslateService,
        public _dialog: MatDialog,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog,
        private _ngZone: NgZone) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({}).zone();
                this.countEstablishments();
                this._establishments.subscribe(() => { this.countEstablishments(); });
            });
        });
        this._roleSub = MeteorObservable.subscribe('getRoleCollaborators').subscribe(() => {
            this._ngZone.run(() => {
                this._roles = Roles.find({}).zone();
            });
        });
    }

    /**
     * Validate if establishments exists
     */
    countEstablishments(): void {
        Establishments.collection.find({}).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * This method allow search collaborators by establishment id
     */
    collaboratorsSearch(_pEstablishmentId: string) {
        this._userDetailsSub = MeteorObservable.subscribe('getUsersDetailsForEstablishment', _pEstablishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._userDetails = UserDetails.find({ establishment_work: _pEstablishmentId }).zone();
        });

        this._usersSub = MeteorObservable.subscribe('getUsersByEstablishment', _pEstablishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._users = Users.find({}).zone();
        });
    }

    /**
     * Collaboratos edition
     * @param _userdetail 
     */
    editCollaborator(_userdetail: UserDetail, _user: User) {
        this._dialogRef = this._dialog.open(CollaboratorsEditionComponent, {
            disableClose: true,
            width: '75%'
        });
        this._dialogRef.componentInstance.selectUserDetail = _userdetail;
        this._dialogRef.componentInstance.selectUser = _user;
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = null;
        });
    }

    /**
     * Change user state
     * @param {string} _pUserDetailId
     */
    changeUserState(_pUserDetail: UserDetail): void {
        if (_pUserDetail) {
            UserDetails.update({ _id: _pUserDetail._id }, { $set: { is_active: !_pUserDetail.is_active } });
        }
    }

    /**
     * Open Collaborator register component
     */
    openCollaboratorstRegister() {
        this._router.navigate(['app/collaborators-register']);
    }

    /**
     * Go to add new Establishment
     */
    goToAddEstablishment() {
        this._router.navigate(['/app/establishment-register']);
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
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}