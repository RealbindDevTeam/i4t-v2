import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { MatDialogRef, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Reward } from '../../../../../../../both/models/establishment/reward.model';
import { Rewards } from '../../../../../../../both/collections/establishment/reward.collection';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { Item } from '../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../both/collections/menu/item.collection';
import { Point } from '../../../../../../../both/models/general/point.model';
import { Points } from '../../../../../../../both/collections/general/point.collection';
import { AlertConfirmComponent } from '../../../general/alert-confirm/alert-confirm.component';
import { RewardEditComponent } from '../reward-edit/reward-edit.component';

@Component({
    selector: 'reward',
    templateUrl: './reward.component.html',
    styleUrls: ['./reward.component.scss']
})
export class RewardComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _rewardForm: FormGroup;
    private _establishmentsFormGroup: FormGroup = new FormGroup({});
    private _mdDialogRef: MatDialogRef<any>;

    private _rewards: Observable<Reward[]>;
    private _establishments: Observable<Establishment[]>;
    private _items: Observable<Item[]>;
    private _points: Observable<Point[]>;

    private _rewardSub: Subscription;
    private _establishmentSub: Subscription;
    private _itemsSub: Subscription;
    private _pointSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _thereAreEstablishments: boolean = true;
    private _thereAreItems: boolean = true;
    private _showEstablishments: boolean = true;
    private _quantityCount: number = 1;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private btnCancelLbl: string;
    public _dialogRef: MatDialogRef<any>;

    /**
     * RewardComponent constructor
     * @param {MatSnackBar} _snackBar 
     * @param {MatDialog} _dialog 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {Router} _router 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(public _snackBar: MatSnackBar,
        public _dialog: MatDialog,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        private _router: Router,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
        this.btnCancelLbl = 'CANCEL';
    }

    /**
     * Implements ngOnInit function
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._rewardForm = new FormGroup({
            item: new FormControl('', [Validators.required]),
            points: new FormControl('', [Validators.required]),
            establishments: this._establishmentsFormGroup
        });
        this._rewardSub = MeteorObservable.subscribe('getRewards', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._rewards = Rewards.find({ creation_user: this._user }).zone();
            });
        });
        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({}).zone();
                Establishments.collection.find({}).fetch().forEach((establishment: Establishment) => {
                });
                this.countEstablishments();
                this._establishments.subscribe(() => { this.createEstablishmentsForm(); this.countEstablishments(); });
            });
        });
        this._itemsSub = MeteorObservable.subscribe('getAdminActiveItems', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
                this.countItems();
                this._items.subscribe(() => { this.countItems(); });
            });
        });
        this._pointSub = MeteorObservable.subscribe('points').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._points = Points.find({ _id: { $gte: '50' } }).zone();
            });
        });
    }

    /**
     * Remove all suscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Validate if establishments exists
     */
    countEstablishments(): void {
        Establishments.collection.find({}).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * Validate if items exists
     */
    countItems(): void {
        Items.collection.find({}).count() > 0 ? this._thereAreItems = true : this._thereAreItems = false;
    }

    /**
     * Create establishments controls in form
     */
    createEstablishmentsForm(): void {
        Establishments.collection.find({}).fetch().forEach((res) => {
            if (this._establishmentsFormGroup.contains(res._id)) {
                this._establishmentsFormGroup.controls[res._id].setValue(false);
            } else {
                let control: FormControl = new FormControl(false);
                this._establishmentsFormGroup.addControl(res._id, control);
            }
        });

        if (Establishments.collection.find({}).count() === 0) {
            this._showEstablishments = false;
        }
    }

    /**
     * Function to add new reward
     */
    addReward(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._rewardForm.valid) {
            let _create_establishments: string[] = [];
            let arr: any[] = Object.keys(this._rewardForm.value.establishments);

            arr.forEach((est) => {
                if (this._rewardForm.value.establishments[est]) {
                    _create_establishments.push(est);
                }
            });

            let _lNewReward = Rewards.collection.insert({
                creation_user: this._user,
                creation_date: new Date(),
                modification_user: '-',
                modification_date: new Date(),
                item_id: this._rewardForm.value.item,
                item_quantity: this._quantityCount,
                points: this._rewardForm.value.points,
                establishments: _create_establishments,
                is_active: true
            });

            if (_lNewReward) {
                let _lMessage: string = this.itemNameTraduction('REWARD.REWARD_CREATED');
                this._snackBar.open(_lMessage, '', { duration: 2500 });
            }
            this.cancel();
        }
    }

    /**
     * Function to update reward status
     * @param {Reward} _pReward
     */
    updateStatus(_pReward: Reward): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        Rewards.update(_pReward._id, {
            $set: {
                is_active: !_pReward.is_active,
                modification_date: new Date(),
                modification_user: this._user
            }
        });
    }

    /**
     * Function to allow remove rewards
     * @param {Reward} _pReward 
     */
    removeReward(_pReward: Reward): void {
        let _lDialogTitle = "REWARD.REMOVE_TITLE";
        let _lDialogContent = "REWARD.REMOVE_MSG";
        let _lError: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';

        if (!Meteor.userId()) {
            this.openDialog(this.titleMsg, '', _lError, '', this.btnAcceptLbl, false);
            return;
        }
        this._mdDialogRef = this._dialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: _lDialogTitle,
                subtitle: '',
                content: _lDialogContent,
                buttonCancel: this.btnCancelLbl,
                buttonAccept: this.btnAcceptLbl,
                showCancel: true
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                Rewards.remove(_pReward._id);
                let _lMessage = this.itemNameTraduction('REWARD.REWARD_REMOVED');
                this._snackBar.open(_lMessage, '', { duration: 2500 });
            }
        });
    }

    /**
     * Add quantity item
     */
    addCount(): void {
        this._quantityCount += 1;
    }

    /**
     * Subtract quantity item
     */
    removeCount(): void {
        if (this._quantityCount > 1) {
            this._quantityCount -= 1;
        }
    }

    /**
     * Function to cancel add reward
     */
    cancel(): void {
        this._rewardForm.reset();
        this._quantityCount = 1;
    }

    /**
     * When user wants edit reward, this function open dialog with reward information
     * @param {Reward} _pReward
     */
    editReward(_pReward: Reward) {
        this._dialogRef = this._dialog.open(RewardEditComponent, {
            disableClose: true,
            width: '50%'
        });
        this._dialogRef.componentInstance._rewardToEdit = _pReward;
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = null;
        });
    }

    /**
     * Go to add new Establishment
     */
    goToAddEstablishment() {
        this._router.navigate(['/app/establishment-register']);
    }

    /**
     * Go to items page
     */
    goToItems(): void {
        this._router.navigate(['app/items']);
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
    * This function open de error dialog according to parameters 
    * @param {string} title
    * @param {string} subtitle
    * @param {string} content
    * @param {string} btnCancelLbl
    * @param {string} btnAcceptLbl
    * @param {boolean} showBtnCancel
    */
    openDialog(title: string, subtitle: string, content: string, btnCancelLbl: string, btnAcceptLbl: string, showBtnCancel: boolean) {

        this._mdDialogRef = this._dialog.open(AlertConfirmComponent, {
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
     * Implements ngOnDestroy
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}