import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { MatDialogRef, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Sections } from '../../../../../../../../both/collections/menu/section.collection';
import { Section } from '../../../../../../../../both/models/menu/section.model';
import { SectionEditComponent } from '../section-edit/section-edit.component';
import { Restaurant } from '../../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../../../both/collections/restaurant/restaurant.collection';
import { AlertConfirmComponent } from '../../../../general/alert-confirm/alert-confirm.component';
import { UserDetails } from '../../../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../../../both/models/auth/user-detail.model';

@Component({
    selector: 'section',
    templateUrl: './section.component.html',
    styleUrls: ['./section.component.scss']
})
export class SectionComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _sectionForm: FormGroup;
    private _restaurantsFormGroup: FormGroup = new FormGroup({});
    private _mdDialogRef: MatDialogRef<any>;

    private _sections: Observable<Section[]>;
    private _restaurants: Observable<Restaurant[]>;
    private _userDetails: Observable<UserDetail[]>;

    private _sectionSub: Subscription;
    private _restaurantSub: Subscription;
    private _userDetailsSub: Subscription;

    public _dialogRef: MatDialogRef<any>;
    private _showRestaurants: boolean = true;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _thereAreRestaurants: boolean = true;
    private _thereAreUsers: boolean = false;
    private _lRestaurantsId: string[] = [];
    private _usersCount: number;

    /**
     * SectionComponent constructor
     * @param {MatSnackBar} snackBar
     * @param {MatDialog} _dialog
     * @param {FormBuilder} _formBuilder
     * @param {TranslateService} _translate
     * @param {NgZone} _ngZone
     * @param {Router} _router
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(public snackBar: MatSnackBar,
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
    }

    /**
     * Implements ngOnInit function
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._sectionForm = new FormGroup({
            name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]),
            restaurants: this._restaurantsFormGroup
        });

        this._restaurantSub = MeteorObservable.subscribe('restaurants', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._restaurants = Restaurants.find({}).zone();
                Restaurants.collection.find({}).fetch().forEach((restaurant: Restaurant) => {
                    this._lRestaurantsId.push(restaurant._id);
                });
                this._userDetailsSub = MeteorObservable.subscribe('getUsersByRestaurantsId', this._lRestaurantsId).subscribe(() => {
                    this._userDetails = UserDetails.find({ current_restaurant: { $in: this._lRestaurantsId } }).zone();
                    this.countRestaurantsUsers();
                    this._userDetails.subscribe(() => { this.countRestaurantsUsers(); });
                });

                this.countRestaurants();
                this._restaurants.subscribe(() => { this.createRestaurantForm(); this.countRestaurants(); });
            });
        });

        this._sectionSub = MeteorObservable.subscribe('sections', this._user).subscribe(() => {
            this._ngZone.run(() => {
                this._sections = Sections.find({}).zone();
            });
        });
    }

    /**
     * Validate if restaurants exists
     */
    countRestaurants(): void {
        Restaurants.collection.find({}).count() > 0 ? this._thereAreRestaurants = true : this._thereAreRestaurants = false;
    }

    /**
     * Validate if restaurants exists
     */
    countRestaurantsUsers(): void {
        let auxUserCount: number;
        auxUserCount = UserDetails.collection.find({ current_restaurant: { $in: this._lRestaurantsId } }).count();

        if (auxUserCount > 0) {
            this._thereAreUsers = true
            this._usersCount = auxUserCount;
        } else {
            this._thereAreUsers = false;
            this._usersCount = 0;
        }
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._sectionSub) { this._sectionSub.unsubscribe(); }
        if (this._restaurantSub) { this._restaurantSub.unsubscribe(); }
        if (this._userDetailsSub) { this._userDetailsSub.unsubscribe(); }
    }

    /**
     * Create restaurants controls in form
     */
    createRestaurantForm(): void {
        Restaurants.collection.find({}).fetch().forEach((res) => {
            if (this._restaurantsFormGroup.contains(res._id)) {
                this._restaurantsFormGroup.controls[res._id].setValue(false);
            } else {
                let control: FormControl = new FormControl(false);
                this._restaurantsFormGroup.addControl(res._id, control);
            }
        });

        if (Restaurants.collection.find({}).count() === 0) {
            this._showRestaurants = false;
        }
    }

    /**
     * Function to add Section
     */
    addSection(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._sectionForm.valid) {
            let _create_restaurants: string[] = [];
            let arr: any[] = Object.keys(this._sectionForm.value.restaurants);

            arr.forEach((rest) => {
                if (this._sectionForm.value.restaurants[rest]) {
                    _create_restaurants.push(rest);
                }
            });

            let _lNewSection = Sections.collection.insert({
                creation_user: this._user,
                creation_date: new Date(),
                modification_user: '-',
                modification_date: new Date(),
                restaurants: _create_restaurants,
                is_active: true,
                name: this._sectionForm.value.name
            });

            if (_lNewSection) {
                let _lMessage: string = this.itemNameTraduction('SECTIONS.SECTION_CREATED');
                this.snackBar.open(_lMessage, '', {
                    duration: 2500
                });
            }

            this.cancel();
        }
    }

    /**
     * Function to update section status
     * @param {Section} _section
     */
    updateStatus(_section: Section): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        Sections.update(_section._id, {
            $set: {
                is_active: !_section.is_active,
                modification_date: new Date(),
                modification_user: this._user
            }
        });
    }

    /**
     * Function to cancel add section
     */
    cancel(): void {
        this._sectionForm.reset();
    }

    /**
     * When user wants edit Section, this function open dialog with section information
     * @param {Section} _section
     */
    open(_section: Section) {
        this._dialogRef = this._dialog.open(SectionEditComponent, {
            disableClose: true,
            width: '50%'
        });
        this._dialogRef.componentInstance._sectionToEdit = _section;
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = null;
        });
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
     * Go to add new Restaurant
     */
    goToAddRestaurant() {
        this._router.navigate(['/app/restaurant-register']);
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
     * Implements ngOnDestroy function
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}