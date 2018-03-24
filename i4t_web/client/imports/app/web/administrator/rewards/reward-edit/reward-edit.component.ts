import { Component, OnInit, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
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

@Component({
    selector: 'reward-edit',
    templateUrl: './reward-edit.component.html',
    styleUrls: ['./reward-edit.component.scss'],
    providers: [UserLanguageService]
})
export class RewardEditComponent implements OnInit {

    private _user = Meteor.userId();
    private _rewardToEdit: Reward;
    private _editRewardForm: FormGroup;
    private _establishmentsFormGroup: FormGroup = new FormGroup({});

    private _establishments: Observable<Establishment[]>;
    private _points: Observable<Point[]>;

    private _itemName: string;
    private _quantityCount: number = 1;
    private _rewardEstablishments: string[] = [];
    private _pointValue: number;

    /**
     * RewardEditComponent constructor
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {MatDialogRef<any>} _dialogRef 
     * @param {NgZone} _ngZone 
     * @param {MatSnackBar} _snackBar 
     * @param {UserLanguageService} _userLanguageService 
     * @param {MatDialog} _mdDialog 
     */
    constructor(private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        public _dialogRef: MatDialogRef<any>,
        private _ngZone: NgZone,
        public snackBar: MatSnackBar,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    ngOnInit() {
        this._editRewardForm = new FormGroup({
            points: new FormControl(this._rewardToEdit.points),
            isActive: new FormControl(this._rewardToEdit.is_active),
            establishments: this._establishmentsFormGroup
        });
        this._itemName = Items.findOne({ _id: this._rewardToEdit.item_id }).name;
        this._pointValue = this._rewardToEdit.points;
        this._quantityCount = this._rewardToEdit.item_quantity;
        this._rewardEstablishments = this._rewardToEdit.establishments;
        this._establishments = Establishments.find({}).zone();
        this._establishments.subscribe(() => { this.createEstablishmentForm(); });
        this._points = Points.find({ _id: { $gte: '50' } }).zone();
    }

    /**
     * Create establishments controls in form
     */
    createEstablishmentForm(): void {
        Establishments.collection.find({}).fetch().forEach((est) => {
            let find = this._rewardEstablishments.filter(e => e === est._id);
            if (find.length > 0) {
                let control: FormControl = new FormControl(true);
                this._establishmentsFormGroup.addControl(est._id, control);
            } else {
                let control: FormControl = new FormControl(false);
                this._establishmentsFormGroup.addControl(est._id, control);
            }
        });
    }

    /**
     * Function to edit Reward
     */
    editReward(): void {
        if (this._editRewardForm.valid) {
            let _edition_establishments: string[] = [];
            let arr: any[] = Object.keys(this._editRewardForm.value.establishments);

            arr.forEach((est) => {
                if (this._editRewardForm.value.establishments[est]) {
                    _edition_establishments.push(est);
                }
            });

            Rewards.update(this._rewardToEdit._id, {
                $set: {
                    modification_user: this._user,
                    modification_date: new Date(),
                    points: this._editRewardForm.value.points,
                    establishments: _edition_establishments,
                    is_active: this._editRewardForm.value.isActive
                }
            });
            let _lMessage: string = this.itemNameTraduction('REWARD.REWARD_EDITED');
            this.snackBar.open(_lMessage, '', { duration: 2500 });
        }
        this._dialogRef.close();
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
}