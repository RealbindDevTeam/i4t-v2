import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from "@angular/router";
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MouseEvent } from "@agm/core";
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Establishment, EstablishmentProfile, EstablishmentProfileImage, EstablishmentSchedule, EstablishmentLocation, EstablishmentSocialNetwork } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments, EstablishmentsProfile } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { TypeOfFood } from '../../../../../../../../both/models/general/type-of-food.model';
import { TypesOfFood } from '../../../../../../../../both/collections/general/type-of-food.collection';
import { AlertConfirmComponent } from '../../../../general/alert-confirm/alert-confirm.component';
import { ImageService } from '../../../../services/general/image.service';

@Component({
    selector: 'establishment-profile',
    templateUrl: './establishment-profile.component.html',
    styleUrls: ['./establishment-profile.component.scss']
})
export class EstablishmentProfileComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _profileForm: FormGroup;
    private _typesOfFoodFormGroup: FormGroup = new FormGroup({});
    private _establishments: Observable<Establishment[]>;
    private _establishmentsProfile: Observable<EstablishmentProfile[]>;
    private _typesOfFood: Observable<TypeOfFood[]>;

    private _establishmentsSub: Subscription;
    private _establishmentProfileSub: Subscription;
    private _typesOfFoodSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishmentProfile: EstablishmentProfile;
    private _schedule: EstablishmentSchedule;
    private _scheduleToEdit: EstablishmentSchedule;

    private _thereAreEstablishments: boolean = true;
    private _anyEstablishmentIsSelected: boolean = false;
    private _scheduleInEditMode: boolean = false;
    private _newImagesToInsert: boolean = false;
    private _mapRender: boolean = false;
    private _loading: boolean = false;
    private _showTypesOfFood: boolean = false;

    private _establishmentName: string = '';
    private _establishmentId: string = '';
    private _titleMsg: string;
    private _btnAcceptLbl: string;
    private _selectedIndex: number = 0;

    private _filesToUpload: Array<EstablishmentProfileImage> = [];
    private _mdDialogRef: MatDialogRef<any>;
    private _profileImages: EstablishmentProfileImage[] = [];

    private _lat: number = 4.5981;
    private _lng: number = -74.0758;

    /**
     * EstablishmentProfileComponent Constructor
     * @param {Router} _router 
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService
     * @param {MatSnackBar} _snackBar
     * @param {MatDialog} _mdDialog
     */
    constructor(private _router: Router,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        private _snackBar: MatSnackBar,
        private _mdDialog: MatDialog,
        private _imageService: ImageService) {
        let _lng: string = this._userLanguageService.getLanguage(Meteor.user());
        _translate.use(_lng);
        _translate.setDefaultLang('en');
        this._imageService.setPickOptionsLang(_lng);
        this._titleMsg = 'SIGNUP.SYSTEM_MSG';
        this._btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentsSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({}).zone();
                this.countEstablishments();
                this._establishments.subscribe(() => { this.countEstablishments(); });
            });
        });
        this._typesOfFoodSub = MeteorObservable.subscribe('typesOfFood').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._typesOfFood = TypesOfFood.find({}).zone();
            });
        });
        this._schedule = {
            monday: {
                isActive: false,
                opening_time: '',
                closing_time: ''
            },
            tuesday: {
                isActive: false,
                opening_time: '',
                closing_time: ''
            },
            wednesday: {
                isActive: false,
                opening_time: '',
                closing_time: ''
            },
            thursday: {
                isActive: false,
                opening_time: '',
                closing_time: ''
            },
            friday: {
                isActive: false,
                opening_time: '',
                closing_time: ''
            },
            saturday: {
                isActive: false,
                opening_time: '',
                closing_time: ''
            },
            sunday: {
                isActive: false,
                opening_time: '',
                closing_time: ''
            },
            holiday: {
                isActive: false,
                opening_time: '',
                closing_time: ''
            }
        };
    }

    /**
     * Remove all subscriptions
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
     * Function to receive establishment selected
     * @param {string} _pEstablishmentId
     * @param {string} _pEstablishmentName
     */
    changeEstablishment(_pEstablishmentId: string, _pEstablishmentName: string): void {
        this._establishmentId = _pEstablishmentId;
        this._establishmentName = _pEstablishmentName;
        this._anyEstablishmentIsSelected = true;
        this._selectedIndex = 0;
        this._profileForm = new FormGroup({
            establishment_description: new FormControl('', [Validators.required]),
            web_page: new FormControl(),
            email: new FormControl(),
            facebookLink: new FormControl(),
            instagramLink: new FormControl(),
            twitterLink: new FormControl(),
            types_of_food: this._typesOfFoodFormGroup
        });
        this._establishmentProfileSub = MeteorObservable.subscribe('getEstablishmentProfile', _pEstablishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishmentsProfile = EstablishmentsProfile.find({ establishment_id: _pEstablishmentId }).zone();
                this.validateProfileImages(_pEstablishmentId);
                this._establishmentsProfile.subscribe(() => { this.validateProfileImages(_pEstablishmentId); });
                this._establishmentProfile = EstablishmentsProfile.findOne({ establishment_id: _pEstablishmentId });
                if (this._establishmentProfile) {
                    this._profileForm.controls['establishment_description'].setValue(this._establishmentProfile.establishment_description);
                    this._profileForm.controls['web_page'].setValue(this._establishmentProfile.web_page === undefined || this._establishmentProfile.web_page === null ? '' : this._establishmentProfile.web_page);
                    this._profileForm.controls['email'].setValue(this._establishmentProfile.email === undefined || this._establishmentProfile.email === null ? '' : this._establishmentProfile.email);
                    if (this._establishmentProfile.social_networks) {
                        this._profileForm.controls['facebookLink'].setValue(this._establishmentProfile.social_networks.facebook === undefined || this._establishmentProfile.social_networks.facebook === null ? '' : this._establishmentProfile.social_networks.facebook);
                        this._profileForm.controls['instagramLink'].setValue(this._establishmentProfile.social_networks.instagram === undefined || this._establishmentProfile.social_networks.instagram === null ? '' : this._establishmentProfile.social_networks.instagram);
                        this._profileForm.controls['twitterLink'].setValue(this._establishmentProfile.social_networks.twitter === undefined || this._establishmentProfile.social_networks.twitter === null ? '' : this._establishmentProfile.social_networks.twitter);
                    }
                    if (this._establishmentProfile.types_of_food && this._establishmentProfile.types_of_food.length > 0) {
                        TypesOfFood.collection.find({}).fetch().forEach((type_of_food) => {
                            let _food = this._establishmentProfile.types_of_food.find(food => food === type_of_food._id);
                            if (_food) {
                                if (this._typesOfFoodFormGroup.contains(type_of_food._id)) {
                                    this._typesOfFoodFormGroup.controls[type_of_food._id].setValue(true);
                                } else {
                                    let control: FormControl = new FormControl(true);
                                    this._typesOfFoodFormGroup.addControl(type_of_food._id, control);
                                }
                            } else {
                                if (this._typesOfFoodFormGroup.contains(type_of_food._id)) {
                                    this._typesOfFoodFormGroup.controls[type_of_food._id].setValue(false);
                                } else {
                                    let control: FormControl = new FormControl(false);
                                    this._typesOfFoodFormGroup.addControl(type_of_food._id, control);
                                }
                            }
                        });
                    } else {
                        TypesOfFood.collection.find({}).fetch().forEach((type_of_food) => {
                            if (this._typesOfFoodFormGroup.contains(type_of_food._id)) {
                                this._typesOfFoodFormGroup.controls[type_of_food._id].setValue(false);
                            } else {
                                let control: FormControl = new FormControl(false);
                                this._typesOfFoodFormGroup.addControl(type_of_food._id, control);
                            }
                        });
                    }
                    this._scheduleInEditMode = true;
                    this._scheduleToEdit = this._establishmentProfile.schedule;
                    this._schedule = this._establishmentProfile.schedule;
                    this._lat = this._establishmentProfile.location.lat;
                    this._lng = this._establishmentProfile.location.lng;
                    this._showTypesOfFood = true;
                } else {
                    this._profileForm.reset();
                    this._scheduleInEditMode = false;
                    this._scheduleToEdit = {};
                    this._lat = 4.5981;
                    this._lng = -74.0758;
                    TypesOfFood.collection.find({}).fetch().forEach((type_of_food) => {
                        if (this._typesOfFoodFormGroup.contains(type_of_food._id)) {
                            this._typesOfFoodFormGroup.controls[type_of_food._id].setValue(false);
                        } else {
                            let control: FormControl = new FormControl(false);
                            this._typesOfFoodFormGroup.addControl(type_of_food._id, control);
                        }
                    });
                    this._showTypesOfFood = true;
                }
            });
        });
    }

    /**
     * Validate profile images
     * @param {string} _pEstablishmentId 
     */
    validateProfileImages(_pEstablishmentId: string): void {
        let _lImagesCount: number = 0;
        let _lEstablishmentProfile: EstablishmentProfile = EstablishmentsProfile.findOne({ establishment_id: _pEstablishmentId });
        if (_lEstablishmentProfile) {
            if (_lEstablishmentProfile.images) {
                _lImagesCount = _lEstablishmentProfile.images.length;
            }
            _lImagesCount > 0 ? this._profileImages = EstablishmentsProfile.findOne({ establishment_id: _pEstablishmentId }).images : this._profileImages = [];
        }
    }

    /**
     * Function to receive schedule from schedule component
     * @param {any} _event 
     */
    receiveSchedule(_event: any): void {
        this._schedule = _event;
    }

    /**
     * Set establishment position
     * @param {MouseEvent} $event
     */
    mapClicked($event: MouseEvent) {
        this._lat = $event.coords.lat;
        this._lng = $event.coords.lng;
    }

    /**
     * Set marker in the map
     * @param {MouseEvent} event 
     */
    markerDragEnd($event: MouseEvent) {
        this._lat = $event.coords.lat;
        this._lng = $event.coords.lng;
    }

    /**
     * Function to insert new image
     */
    changeImage(): void {
        this._imageService.client.pick(this._imageService.pickOptionsMultipleFiles).then((res) => {
            this._filesToUpload = res.filesUploaded;
            this._newImagesToInsert = true;
        }).catch((err) => {
            var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
            this.openDialog(this._titleMsg, '', error, '', this._btnAcceptLbl, false);
        });
    }

    /**
     * Set establishment profile information
     */
    setEstablishmentProfile(): void {
        let _lEstablishmentLocation: EstablishmentLocation = { lat: this._lat, lng: this._lng };
        let _lEstablishmentSocialNetwork: EstablishmentSocialNetwork = {};

        let _lEstablishmentProfile: EstablishmentProfile = {
            establishment_id: this._establishmentId,
            establishment_description: this._profileForm.value.establishment_description,
            schedule: this._schedule,
            location: _lEstablishmentLocation
        };

        let arrTypeOrFood: any[] = Object.keys(this._profileForm.value.types_of_food);
        let _lTypesOfFoodToInsert: string[] = [];

        arrTypeOrFood.forEach((food) => {
            if (this._profileForm.value.types_of_food[food]) {
                _lTypesOfFoodToInsert.push(food);
            }
        });

        if (this._profileForm.value.facebookLink !== '' && this._profileForm.value.facebookLink !== null) { _lEstablishmentSocialNetwork.facebook = this._profileForm.value.facebookLink; }
        if (this._profileForm.value.instagramLink !== '' && this._profileForm.value.instagramLink !== null) { _lEstablishmentSocialNetwork.instagram = this._profileForm.value.instagramLink; }
        if (this._profileForm.value.twitterLink !== '' && this._profileForm.value.twitterLink !== null) { _lEstablishmentSocialNetwork.twitter = this._profileForm.value.twitterLink; }

        this._loading = true;
        setTimeout(() => {
            if (this._establishmentProfile) {
                _lEstablishmentProfile.modification_date = new Date();
                _lEstablishmentProfile.modification_user = this._user;

                let _lImages: EstablishmentProfileImage[] = [];
                this._profileImages.forEach((img) => {
                    _lImages.push(img);
                });
                this._filesToUpload.forEach((img) => {
                    _lImages.push(img);
                });

                if (this._newImagesToInsert) {
                    EstablishmentsProfile.update({ _id: this._establishmentProfile._id }, {
                        $set: {
                            establishment_description: _lEstablishmentProfile.establishment_description,
                            schedule: _lEstablishmentProfile.schedule,
                            location: _lEstablishmentProfile.location,
                            images: _lImages
                        }
                    });
                    this._filesToUpload = [];
                    this._newImagesToInsert = false;
                } else {
                    EstablishmentsProfile.update({ _id: this._establishmentProfile._id }, {
                        $set: {
                            establishment_description: _lEstablishmentProfile.establishment_description,
                            schedule: _lEstablishmentProfile.schedule,
                            location: _lEstablishmentProfile.location,
                        }
                    });
                }

                if (this._profileForm.controls['web_page'].value !== '' && this._profileForm.controls['web_page'].value !== null) {
                    EstablishmentsProfile.update({ _id: this._establishmentProfile._id }, { $set: { web_page: this._profileForm.controls['web_page'].value } });
                } else if ((this._profileForm.controls['web_page'].value === '' || this._profileForm.controls['web_page'].value === null) && (this._establishmentProfile.web_page !== undefined && this._establishmentProfile.web_page !== null)) {
                    EstablishmentsProfile.update({ _id: this._establishmentProfile._id }, { $unset: { web_page: true } });
                }

                if (this._profileForm.controls['email'].value !== '' && this._profileForm.controls['email'].value !== null) {
                    EstablishmentsProfile.update({ _id: this._establishmentProfile._id }, { $set: { email: this._profileForm.controls['email'].value } });
                } else if ((this._profileForm.controls['email'].value === '' || this._profileForm.controls['email'].value === null) && (this._establishmentProfile.email !== undefined && this._establishmentProfile.email !== null)) {
                    EstablishmentsProfile.update({ _id: this._establishmentProfile._id }, { $unset: { email: true } });
                }

                if (Object.keys(_lEstablishmentSocialNetwork).length !== 0) {
                    EstablishmentsProfile.update({ _id: this._establishmentProfile._id }, { $set: { social_networks: _lEstablishmentSocialNetwork } });
                } else if (Object.keys(_lEstablishmentSocialNetwork).length === 0 && (this._establishmentProfile.social_networks !== undefined && this._establishmentProfile.social_networks !== null)) {
                    EstablishmentsProfile.update({ _id: this._establishmentProfile._id }, { $unset: { social_networks: true } });
                }

                EstablishmentsProfile.update({ _id: this._establishmentProfile._id }, { $set: { types_of_food: _lTypesOfFoodToInsert } });

                let _lMessage: string = this.itemNameTraduction('RESTAURANT_PROFILE.PROFILE_UPDATED');
                this._snackBar.open(_lMessage, '', { duration: 2500 });
            } else {
                if (this._profileForm.valid) {
                    _lEstablishmentProfile.creation_user = this._user;
                    _lEstablishmentProfile.creation_date = new Date();
                    _lEstablishmentProfile.modification_user = '-';
                    _lEstablishmentProfile.modification_date = new Date();

                    if (this._newImagesToInsert) {
                        _lEstablishmentProfile.images = this._filesToUpload;
                        this._filesToUpload = [];
                        this._newImagesToInsert = false;
                    }

                    if (this._profileForm.controls['web_page'].value !== '' && this._profileForm.controls['web_page'].value !== null) { _lEstablishmentProfile.web_page = this._profileForm.value.web_page; }
                    if (this._profileForm.controls['email'].value !== '' && this._profileForm.controls['email'].value !== null) { _lEstablishmentProfile.email = this._profileForm.value.email; }

                    if (Object.keys(_lEstablishmentSocialNetwork).length !== 0) { _lEstablishmentProfile.social_networks = _lEstablishmentSocialNetwork; }
                    _lEstablishmentProfile.types_of_food = _lTypesOfFoodToInsert;

                    let _newProfileId: string = EstablishmentsProfile.collection.insert(_lEstablishmentProfile);
                    this._establishmentProfile = EstablishmentsProfile.findOne({ _id: _newProfileId });

                    let _lMessage: string = this.itemNameTraduction('RESTAURANT_PROFILE.PROFILE_CREATED');
                    this._snackBar.open(_lMessage, '', { duration: 2500 });
                }
            }
            this._loading = false;
        }, 1500);
    }

    /**
     * Remove establishment image profile
     * @param {string} _pImgHandle 
     */
    removeImageProfile(_pImgHandle: string) {
        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: this.itemNameTraduction('RESTAURANT_PROFILE.REMOVE_IMAGE'),
                subtitle: '',
                content: this.itemNameTraduction('RESTAURANT_PROFILE.REMOVE_IMAGE_CONFIRM'),
                buttonCancel: this.itemNameTraduction('NO'),
                buttonAccept: this.itemNameTraduction('YES'),
                showCancel: true
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                /*let _lEstablishmentProfileImage: EstablishmentProfileImage = EstablishmentsProfile.findOne({ _id: this._establishmentProfile._id }).images.filter((img) => img.handle ===_pImgHandle)[0];
                if (_lEstablishmentProfileImage) {
                    this._imageService.client.remove(_lEstablishmentProfileImage.handle).then((res) => {
                        console.log(res);
                    }).catch((err) => {
                        var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
                        this.openDialog(this._titleMsg, '', error, '', this._btnAcceptLbl, false);
                    });
                }*/
                EstablishmentsProfile.update({ _id: this._establishmentProfile._id }, { $pull: { images: { handle: _pImgHandle } } });
                EstablishmentsProfile.update({ _id: this._establishmentProfile._id }, { $set: { modification_user: this._user, modification_date: new Date() } });
                let _lMessage: string = this.itemNameTraduction('RESTAURANT_PROFILE.IMAGE_REMOVED');
                this._snackBar.open(_lMessage, '', { duration: 2500 });
            }
        });
    }

    /**
     * Go to add new Establishment
     */
    goToAddEstablishment(): void {
        this._router.navigate(['/app/establishment-register']);
    }

    /**
     * Evaluate tabs changes
     * @param {any} _tab 
     */
    tabChanged(_tab: any): void {
        this._mapRender = _tab.index === 4 ? true : false;
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