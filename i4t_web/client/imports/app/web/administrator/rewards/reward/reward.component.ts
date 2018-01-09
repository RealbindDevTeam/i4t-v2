import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
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

    private _rewardSub: Subscription;
    private _establishmentSub: Subscription;
    private _itemsSub: Subscription;

    private _thereAreEstablishments: boolean = true;
    private _thereAreItems: boolean = true;
    private _showEstablishments: boolean = true;

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
    }

    /**
     * Implements ngOnInit function
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._rewardSub = MeteorObservable.subscribe('getRewards', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._rewards = Rewards.find({ creation_user: this._user }).zone();
            });
        });
        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({}).zone();
                Establishments.collection.find({}).fetch().forEach((establishment: Establishment) => {
                });
                this.countEstablishments();
                this._establishments.subscribe(() => { this.createEstablishmentsForm(); this.countEstablishments(); });
            });
        });
        this._itemsSub = MeteorObservable.subscribe('items', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
                this.countItems();
                this._items.subscribe(() => { this.countItems(); });
            });
        });
    }

    /**
     * Remove all suscriptions
     */
    removeSubscriptions(): void {
        if (this._rewardSub) { this._rewardSub.unsubscribe(); }
        if (this._establishmentSub) { this._establishmentSub.unsubscribe(); }
        if (this._itemsSub) { this._itemsSub.unsubscribe(); }
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
     * Implements ngOnDestroy
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}