import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatRadioChange, MatDialogRef, MatDialog } from '@angular/material';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../../../services/general/user-language.service';
//import { RestaurantLegality } from '../../../../../../../../../../both/models/restaurant/restaurant.model';
//import { RestaurantsLegality } from '../../../../../../../../../../both/collections/restaurant/restaurant.collection';
import { AlertConfirmComponent } from '../../../../../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'colombia-legality',
    templateUrl: './colombia-legality.component.html',
    styleUrls: ['./colombia-legality.component.scss']
})
export class ColombiaLegalityComponent implements OnInit, OnDestroy {

    @Input() restaurantId: string;
    @Output() colombiaLegality = new EventEmitter();
    @Output() previous = new EventEmitter();
    @Output() cancel = new EventEmitter();

    private _colombiaLegalityForm: FormGroup;
    private _regimeSelected: string;
    private _forcedToInvoiceValue: boolean = false;
    private _showForcedToInvoice: boolean = false;
    private _showGeneralInvoice: boolean = false;
    private _showInvoiceSecondPart: boolean = false;
    private _showInvoiceFinalPart: boolean = false;
    private _bigContributorValue: boolean = false;
    private _showBigContributorDetail: boolean = false;
    private _selfAcceptingValue: boolean = false;
    private _showSeltAcceptingDetail: boolean = false;
    private _showPrefixName: boolean = false;
    private _prefrixValue: boolean = false;
    private _showNextResolution: boolean = false;
    private _showPrefixName2: boolean = false;
    private _prefixValue2: boolean = false;
    private _isEnableTwoResolution: boolean = false;
    private _showDivider: boolean = false;
    private _retainingAgent: boolean = false;
    private _showMessage: boolean = false;

    private _restaurantLegalitySub: Subscription;
    private _restaurantLegality: any = { restaurant_id: '' };
    private _restaurantLegalityInEditMode: any;
    private _dialogRef: MatDialogRef<any>;

    /**
     * ColombiaLegalityComponent Constructor
     * @param {TranslateService} _translate 
     * @param {UserLanguageService} _userLanguageService
     * @param {MatDialog} _mdDialog
     * @param {NgZone} _ngZone
     */
    constructor(private _translate: TranslateService,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog,
        private _ngZone: NgZone) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this._colombiaLegalityForm = new FormGroup({
            forced_to_invoice: new FormControl(false),
            business_name: new FormControl('', [Validators.required]),
            document: new FormControl('', [Validators.required]),
            invoice_resolution: new FormControl('', [Validators.required]),
            invoice_resolution_date: new FormControl('', [Validators.required]),
            prefix: new FormControl(false),
            prefix_name: new FormControl(''),
            numeration_from: new FormControl('', [Validators.required]),
            numeration_to: new FormControl('', [Validators.required]),
            is_big_contributor: new FormControl(false),
            big_contributor_resolution: new FormControl(''),
            big_contributor_date: new FormControl(''),
            is_self_accepting: new FormControl(false),
            self_accepting_resolution: new FormControl(''),
            self_accepting_date: new FormControl(''),
            text_at_the_end: new FormControl(''),
            invoice_resolution_two: new FormControl(''),
            invoice_resolution_date_two: new FormControl(''),
            prefix_two: new FormControl(false),
            prefix_name_two: new FormControl(''),
            numeration_from_two: new FormControl(''),
            numeration_to_two: new FormControl(''),
            is_retaining_agent: new FormControl(false)
        });
        if (this.restaurantId !== null && this.restaurantId !== undefined) {
            this._restaurantLegalitySub = MeteorObservable.subscribe('getRestaurantLegality', this.restaurantId).subscribe(() => {
                this._ngZone.run(() => {
                    //this._restaurantLegalityInEditMode = RestaurantsLegality.findOne({ restaurant_id: this.restaurantId });
                    if (this._restaurantLegalityInEditMode) {
                        this._showDivider = true;
                        this._showNextResolution = true;
                        this._restaurantLegality = this._restaurantLegalityInEditMode;
                        this._regimeSelected = this._restaurantLegalityInEditMode.regime;

                        this._colombiaLegalityForm.controls['forced_to_invoice'].setValue(this._restaurantLegalityInEditMode.forced_to_invoice === undefined || this._restaurantLegalityInEditMode.forced_to_invoice === null ? false : this._restaurantLegalityInEditMode.forced_to_invoice);
                        this._forcedToInvoiceValue = this._restaurantLegalityInEditMode.forced_to_invoice === undefined || this._restaurantLegalityInEditMode.forced_to_invoice === null ? false : this._restaurantLegalityInEditMode.forced_to_invoice;
                        this._colombiaLegalityForm.controls['business_name'].setValue(this._restaurantLegalityInEditMode.business_name === undefined || this._restaurantLegalityInEditMode.business_name === null ? '' : this._restaurantLegalityInEditMode.business_name);
                        this._colombiaLegalityForm.controls['document'].setValue(this._restaurantLegalityInEditMode.document === undefined || this._restaurantLegalityInEditMode.document === null ? '' : this._restaurantLegalityInEditMode.document);
                        this._colombiaLegalityForm.controls['invoice_resolution'].setValue(this._restaurantLegalityInEditMode.invoice_resolution === undefined || this._restaurantLegalityInEditMode.invoice_resolution === null ? '' : this._restaurantLegalityInEditMode.invoice_resolution);
                        this._colombiaLegalityForm.controls['invoice_resolution_date'].setValue(this._restaurantLegalityInEditMode.invoice_resolution_date === undefined || this._restaurantLegalityInEditMode.invoice_resolution_date === null ? '' : this._restaurantLegalityInEditMode.invoice_resolution_date);
                        this._colombiaLegalityForm.controls['prefix'].setValue(this._restaurantLegalityInEditMode.prefix === undefined || this._restaurantLegalityInEditMode.prefix === null ? false : this._restaurantLegalityInEditMode.prefix);
                        this._prefrixValue = this._restaurantLegalityInEditMode.prefix === undefined || this._restaurantLegalityInEditMode.prefix === null ? false : this._restaurantLegalityInEditMode.prefix;
                        this._colombiaLegalityForm.controls['prefix_name'].setValue(this._restaurantLegalityInEditMode.prefix_name === undefined || this._restaurantLegalityInEditMode.prefix_name === null ? '' : this._restaurantLegalityInEditMode.prefix_name);
                        this._colombiaLegalityForm.controls['numeration_from'].setValue(this._restaurantLegalityInEditMode.numeration_from === undefined || this._restaurantLegalityInEditMode.numeration_from === null ? '' : this._restaurantLegalityInEditMode.numeration_from);
                        this._colombiaLegalityForm.controls['numeration_to'].setValue(this._restaurantLegalityInEditMode.numeration_to === undefined || this._restaurantLegalityInEditMode.numeration_to === null ? '' : this._restaurantLegalityInEditMode.numeration_to);
                        this._colombiaLegalityForm.controls['is_big_contributor'].setValue(this._restaurantLegalityInEditMode.is_big_contributor === undefined || this._restaurantLegalityInEditMode.is_big_contributor === null ? false : this._restaurantLegalityInEditMode.is_big_contributor);
                        this._bigContributorValue = this._restaurantLegalityInEditMode.is_big_contributor === undefined || this._restaurantLegalityInEditMode.is_big_contributor === null ? false : this._restaurantLegalityInEditMode.is_big_contributor;
                        this._colombiaLegalityForm.controls['big_contributor_resolution'].setValue(this._restaurantLegalityInEditMode.big_contributor_resolution === undefined || this._restaurantLegalityInEditMode.big_contributor_resolution === null ? '' : this._restaurantLegalityInEditMode.big_contributor_resolution);
                        this._colombiaLegalityForm.controls['big_contributor_date'].setValue(this._restaurantLegalityInEditMode.big_contributor_date === undefined || this._restaurantLegalityInEditMode.big_contributor_date === null ? '' : this._restaurantLegalityInEditMode.big_contributor_date);
                        this._colombiaLegalityForm.controls['is_self_accepting'].setValue(this._restaurantLegalityInEditMode.is_self_accepting === undefined || this._restaurantLegalityInEditMode.is_self_accepting === null ? false : this._restaurantLegalityInEditMode.is_self_accepting);
                        this._selfAcceptingValue = this._restaurantLegalityInEditMode.is_self_accepting === undefined || this._restaurantLegalityInEditMode.is_self_accepting === null ? false : this._restaurantLegalityInEditMode.is_self_accepting;
                        this._colombiaLegalityForm.controls['self_accepting_resolution'].setValue(this._restaurantLegalityInEditMode.self_accepting_resolution === undefined || this._restaurantLegalityInEditMode.self_accepting_resolution === null ? '' : this._restaurantLegalityInEditMode.self_accepting_resolution);
                        this._colombiaLegalityForm.controls['self_accepting_date'].setValue(this._restaurantLegalityInEditMode.self_accepting_date === undefined || this._restaurantLegalityInEditMode.self_accepting_date === null ? '' : this._restaurantLegalityInEditMode.self_accepting_date);
                        this._colombiaLegalityForm.controls['text_at_the_end'].setValue(this._restaurantLegalityInEditMode.text_at_the_end === undefined || this._restaurantLegalityInEditMode.text_at_the_end === null ? '' : this._restaurantLegalityInEditMode.text_at_the_end);

                        this._colombiaLegalityForm.controls['invoice_resolution_two'].setValue(this._restaurantLegalityInEditMode.invoice_resolution2 === undefined || this._restaurantLegalityInEditMode.invoice_resolution2 === null ? '' : this._restaurantLegalityInEditMode.invoice_resolution2);
                        this._colombiaLegalityForm.controls['invoice_resolution_date_two'].setValue(this._restaurantLegalityInEditMode.invoice_resolution_date2 === undefined || this._restaurantLegalityInEditMode.invoice_resolution_date2 === null ? '' : this._restaurantLegalityInEditMode.invoice_resolution_date2);
                        this._colombiaLegalityForm.controls['prefix_two'].setValue(this._restaurantLegalityInEditMode.prefix2 === undefined || this._restaurantLegalityInEditMode.prefix2 === null ? false : this._restaurantLegalityInEditMode.prefix2);
                        this._prefixValue2 = this._restaurantLegalityInEditMode.prefix2 === undefined || this._restaurantLegalityInEditMode.prefix2 === null ? false : this._restaurantLegalityInEditMode.prefix2;
                        this._colombiaLegalityForm.controls['prefix_name_two'].setValue(this._restaurantLegalityInEditMode.prefix_name2 === undefined || this._restaurantLegalityInEditMode.prefix_name2 === null ? '' : this._restaurantLegalityInEditMode.prefix_name2);
                        this._colombiaLegalityForm.controls['numeration_from_two'].setValue(this._restaurantLegalityInEditMode.numeration_from2 === undefined || this._restaurantLegalityInEditMode.numeration_from2 === null ? '' : this._restaurantLegalityInEditMode.numeration_from2);
                        this._colombiaLegalityForm.controls['numeration_to_two'].setValue(this._restaurantLegalityInEditMode.numeration_to2 === undefined || this._restaurantLegalityInEditMode.numeration_to2 === null ? '' : this._restaurantLegalityInEditMode.numeration_to2);
                        this._isEnableTwoResolution = this._restaurantLegalityInEditMode.enable_two;

                        this._colombiaLegalityForm.controls['is_retaining_agent'].setValue(this._restaurantLegalityInEditMode.is_retaining_agent === undefined || this._restaurantLegalityInEditMode.is_retaining_agent === null ? false : this._restaurantLegalityInEditMode.is_retaining_agent);
                        this._retainingAgent = this._restaurantLegalityInEditMode.is_retaining_agent === undefined || this._restaurantLegalityInEditMode.is_retaining_agent === null ? false : this._restaurantLegalityInEditMode.is_retaining_agent;

                        if (this._restaurantLegalityInEditMode.regime === 'regime_co') {
                            this._showForcedToInvoice = false;
                            this._showGeneralInvoice = true;

                            if (this._restaurantLegalityInEditMode.prefix) {
                                this._showPrefixName = true;
                            } else {
                                this._showPrefixName = false;
                            }
                            if (this._restaurantLegalityInEditMode.prefix2) {
                                this._showPrefixName2 = true;
                            } else {
                                this._showPrefixName2 = false;
                            }
                            this._showInvoiceSecondPart = true;
                            if (this._restaurantLegalityInEditMode.is_big_contributor) {
                                this._showBigContributorDetail = true;
                            } else {
                                this._showBigContributorDetail = false;
                            }
                            if (this._restaurantLegalityInEditMode.is_self_accepting) {
                                this._showSeltAcceptingDetail = true;
                            } else {
                                this._showSeltAcceptingDetail = false;
                            }
                            this._showInvoiceFinalPart = true;
                        } else if (this._restaurantLegalityInEditMode.regime === 'regime_si') {
                            this._showForcedToInvoice = true;
                            if (this._restaurantLegalityInEditMode.forced_to_invoice) {
                                this._showGeneralInvoice = true;
                                this._showMessage = true;
                                if (this._restaurantLegalityInEditMode.prefix) {
                                    this._showPrefixName = true;
                                } else {
                                    this._showPrefixName = false;
                                }
                                if (this._restaurantLegalityInEditMode.prefix2) {
                                    this._showPrefixName2 = true;
                                } else {
                                    this._showPrefixName2 = false;
                                }
                                this._showInvoiceSecondPart = false;
                                this._showBigContributorDetail = false;
                                this._showSeltAcceptingDetail = false;
                                this._showInvoiceFinalPart = true;
                            }
                        }
                    }
                });
            });
        }
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._restaurantLegalitySub) { this._restaurantLegalitySub.unsubscribe(); }
    }

    /**
     * Evaluate radio changes
     * @param {MatRadioChange} _event 
     */
    radioChange(_event: MatRadioChange) {
        this._colombiaLegalityForm.reset();
        this._restaurantLegality = this._restaurantLegalityInEditMode === null || this._restaurantLegalityInEditMode === undefined ? { restaurant_id: '' } : { _id: this._restaurantLegalityInEditMode._id, restaurant_id: this._restaurantLegalityInEditMode.restaurant_id };
        if (_event.value === 'regime_co') {
            this._restaurantLegality.regime = _event.value;
            this._restaurantLegality.forced_to_invoice = true;
            this._restaurantLegality.forced_to_inc = true;
            this._forcedToInvoiceValue = false;
            this._showForcedToInvoice = false;
            this._showGeneralInvoice = true;
            this._showInvoiceSecondPart = true;
            this._showInvoiceFinalPart = true;
            this._bigContributorValue = false;
            this._showBigContributorDetail = false;
            this._selfAcceptingValue = false;
            this._showSeltAcceptingDetail = false;
            this._showPrefixName = false;
            this._showPrefixName2 = false;
            this._prefrixValue = false;
            this._prefixValue2 = false;
            this._showDivider = true;
            this._retainingAgent = false;
        } else if (_event.value === 'regime_si') {
            this._restaurantLegality.regime = _event.value;
            this._restaurantLegality.forced_to_invoice = false;
            this._restaurantLegality.forced_to_inc = false;
            this._forcedToInvoiceValue = false;
            this._showForcedToInvoice = true;
            this._showGeneralInvoice = false;
            this._showInvoiceSecondPart = false;
            this._showInvoiceFinalPart = false;
            this._bigContributorValue = false;
            this._showBigContributorDetail = false;
            this._selfAcceptingValue = false;
            this._showSeltAcceptingDetail = false;
            this._showPrefixName = false;
            this._showPrefixName2 = false;
            this._prefrixValue = false;
            this._prefixValue2 = false;
            this._showDivider = false;
            this._retainingAgent = false;
        }
    }

    /**
     * Evaluate forced to invoice changes
     * @param {any} _event
     */
    evaluateForcedToInvoiceCheck(_event: any) {
        if (_event.checked) {
            this._showGeneralInvoice = true;
            this._showInvoiceFinalPart = true;
            this._restaurantLegality.forced_to_invoice = true;
            this._showMessage = true;
        } else {
            this._restaurantLegality = this._restaurantLegalityInEditMode === null || this._restaurantLegalityInEditMode === undefined ? { restaurant_id: '' } : { _id: this._restaurantLegalityInEditMode._id, restaurant_id: this._restaurantLegalityInEditMode.restaurant_id };
            this._restaurantLegality.regime = 'regime_si';
            this._restaurantLegality.forced_to_invoice = false;
            this._restaurantLegality.forced_to_inc = false;
            this._showGeneralInvoice = false;
            this._showInvoiceFinalPart = false;
            this._restaurantLegality.forced_to_invoice = false;
            this._showMessage = false;
        }
    }

    /**
     * Evaluate prefix changes
     * @param {any} _event 
     */
    evaluatePrefixCheck(_event: any) {
        if (_event.checked) {
            this._showPrefixName = true;
            this._restaurantLegality.prefix = true;
        } else {
            this._showPrefixName = false;
            this._restaurantLegality.prefix = false;
        }
    }

    /**
     * Evaluate prefix changes
     */
    evaluatePrefix2Check(_event: any) {
        if (_event.checked) {
            this._showPrefixName2 = true;
            this._restaurantLegality.prefix2 = true;
        } else {
            this._showPrefixName2 = false;
            this._restaurantLegality.prefix2 = false;
        }
    }

    /**
     * Evaluate big contributor changes
     * @param {any} _event 
     */
    evaluateBigContributorCheck(_event: any) {
        if (_event.checked) {
            this._showBigContributorDetail = true;
            this._restaurantLegality.is_big_contributor = true;
        } else {
            this._showBigContributorDetail = false;
            this._restaurantLegality.is_big_contributor = false;
        }
    }

    /**
     * Evaluate self accepting changes
     * @param {any} _event
     */
    evaluateSelfAcceptingCheck(_event: any) {
        if (_event.checked) {
            this._showSeltAcceptingDetail = true;
            this._restaurantLegality.is_self_accepting = true;
        } else {
            this._showSeltAcceptingDetail = false;
            this._restaurantLegality.is_self_accepting = false;
        }
    }

    /**
     * Evaluate retaining agent changes
     */
    evaluateRetainingCheck(_event: any) {
        if (_event.checked) {
            this._restaurantLegality.is_retaining_agent = true;
        } else {
            this._restaurantLegality.is_retaining_agent = false;
        }
    }

    /**
     * Build colombia restaurant legality object
     */
    buildColombiaRestaurantLegality(): void {
        let _validator: boolean = true;
        if (this._restaurantLegality.regime === 'regime_co') {
            this._restaurantLegality.business_name = this._colombiaLegalityForm.value.business_name;
            this._restaurantLegality.document = this._colombiaLegalityForm.value.document;
            this._restaurantLegality.invoice_resolution = this._colombiaLegalityForm.value.invoice_resolution;
            this._restaurantLegality.invoice_resolution_date = this._colombiaLegalityForm.value.invoice_resolution_date;
            this._restaurantLegality.prefix = this._colombiaLegalityForm.value.prefix;
            if (this._restaurantLegality.prefix) {
                this._restaurantLegality.prefix_name = this._colombiaLegalityForm.value.prefix_name;
                if (this._restaurantLegality.prefix_name === null || this._restaurantLegality.prefix_name === undefined || this._restaurantLegality.prefix_name === '') {
                    this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                        disableClose: true,
                        data: {
                            title: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.INVALID_DATA'),
                            subtitle: '',
                            content: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ENTER_PREFIX'),
                            buttonCancel: '',
                            buttonAccept: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ACCEPT'),
                            showCancel: false
                        }
                    });
                    _validator = false;
                }
            } else {
                this._restaurantLegality.prefix_name = null;
            }
            this._restaurantLegality.numeration_from = this._colombiaLegalityForm.value.numeration_from;
            this._restaurantLegality.numeration_to = this._colombiaLegalityForm.value.numeration_to;

            //info to next resolution

            if (this._restaurantLegalityInEditMode) {
                this._restaurantLegality.invoice_resolution2 = this._colombiaLegalityForm.value.invoice_resolution_two;
                this._restaurantLegality.invoice_resolution_date2 = this._colombiaLegalityForm.value.invoice_resolution_date_two;
                this._restaurantLegality.prefix2 = this._colombiaLegalityForm.value.prefix_two;
                if (this._restaurantLegality.prefix2) {
                    this._restaurantLegality.prefix_name2 = this._colombiaLegalityForm.value.prefix_name_two;
                    if (this._restaurantLegality.prefix_name2 == null || this._restaurantLegality.prefix_name2 === undefined || this._restaurantLegality.prefix_name2 === '') {
                        this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                            disableClose: true,
                            data: {
                                title: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.INVALID_DATA'),
                                subtitle: '',
                                content: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ENTER_PREFIX'),
                                buttonCancel: '',
                                buttonAccept: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ACCEPT'),
                                showCancel: false
                            }
                        });
                        _validator = false;
                    }
                } else {
                    this._restaurantLegality.prefix_name2 = null;
                }
                this._restaurantLegality.numeration_from2 = this._colombiaLegalityForm.value.numeration_from_two;
                this._restaurantLegality.numeration_to2 = this._colombiaLegalityForm.value.numeration_to_two;
            } else {
                this._restaurantLegality.enable_two = false;
                this._restaurantLegality.current_value = null;
                this._restaurantLegality.start_new_value = true;
            }
            //info to next resolution

            this._restaurantLegality.is_big_contributor = this._colombiaLegalityForm.value.is_big_contributor;
            if (this._restaurantLegality.is_big_contributor) {
                this._restaurantLegality.big_contributor_resolution = this._colombiaLegalityForm.value.big_contributor_resolution;
                this._restaurantLegality.big_contributor_date = this._colombiaLegalityForm.value.big_contributor_date;
                if (this._restaurantLegality.big_contributor_resolution === null || this._restaurantLegality.big_contributor_resolution === undefined || this._restaurantLegality.big_contributor_resolution === ''
                    || this._restaurantLegality.big_contributor_date === null || this._restaurantLegality.big_contributor_date === undefined || this._restaurantLegality.big_contributor_date.toString() === '') {
                    this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                        disableClose: true,
                        data: {
                            title: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.INVALID_DATA'),
                            subtitle: '',
                            content: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ENTER_BIG_CONTRIBUTOR_FILES'),
                            buttonCancel: '',
                            buttonAccept: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ACCEPT'),
                            showCancel: false
                        }
                    });
                    _validator = false;
                }
            } else {
                this._restaurantLegality.big_contributor_resolution = null;
                this._restaurantLegality.big_contributor_date = null;
            }
            this._restaurantLegality.is_self_accepting = this._colombiaLegalityForm.value.is_self_accepting;
            if (this._restaurantLegality.is_self_accepting) {
                this._restaurantLegality.self_accepting_resolution = this._colombiaLegalityForm.value.self_accepting_resolution;
                this._restaurantLegality.self_accepting_date = this._colombiaLegalityForm.value.self_accepting_date;
                if (this._restaurantLegality.self_accepting_resolution === null || this._restaurantLegality.self_accepting_resolution === undefined || this._restaurantLegality.self_accepting_resolution === ''
                    || this._restaurantLegality.self_accepting_date === null || this._restaurantLegality.self_accepting_date === undefined || this._restaurantLegality.self_accepting_date.toString() === '') {
                    this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                        disableClose: true,
                        data: {
                            title: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.INVALID_DATA'),
                            subtitle: '',
                            content: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ENTER_SELF_ACCEPTING_FILES'),
                            buttonCancel: '',
                            buttonAccept: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ACCEPT'),
                            showCancel: false
                        }
                    });
                    _validator = false;
                }
            } else {
                this._restaurantLegality.self_accepting_resolution = null;
                this._restaurantLegality.self_accepting_date = null;
            }
            this._restaurantLegality.is_retaining_agent = this._colombiaLegalityForm.value.is_retaining_agent;
            this._restaurantLegality.text_at_the_end = this._colombiaLegalityForm.value.text_at_the_end;
            if (this._colombiaLegalityForm.valid) {
                if (_validator) {
                    this.colombiaLegality.emit(this._restaurantLegality);
                }
            } else {
                this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                    disableClose: true,
                    data: {
                        title: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.INVALID_DATA'),
                        subtitle: '',
                        content: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.REQUIRED_FILES'),
                        buttonCancel: '',
                        buttonAccept: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ACCEPT'),
                        showCancel: false
                    }
                });
            }
        } else if (this._restaurantLegality.regime === 'regime_si') {
            if (this._restaurantLegality.forced_to_invoice) {
                this._restaurantLegality.business_name = this._colombiaLegalityForm.value.business_name;
                this._restaurantLegality.document = this._colombiaLegalityForm.value.document;
                this._restaurantLegality.invoice_resolution = this._colombiaLegalityForm.value.invoice_resolution;
                this._restaurantLegality.invoice_resolution_date = this._colombiaLegalityForm.value.invoice_resolution_date;
                this._restaurantLegality.prefix = this._colombiaLegalityForm.value.prefix;
                if (this._restaurantLegality.prefix) {
                    this._restaurantLegality.prefix_name = this._colombiaLegalityForm.value.prefix_name;
                    if (this._restaurantLegality.prefix_name === null || this._restaurantLegality.prefix_name === undefined || this._restaurantLegality.prefix_name === '') {
                        this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                            disableClose: true,
                            data: {
                                title: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.INVALID_DATA'),
                                subtitle: '',
                                content: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ENTER_PREFIX'),
                                buttonCancel: '',
                                buttonAccept: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ACCEPT'),
                                showCancel: false
                            }
                        });
                        _validator = false;
                    }
                } else {
                    this._restaurantLegality.prefix_name = null;
                }
                this._restaurantLegality.numeration_from = this._colombiaLegalityForm.value.numeration_from;
                this._restaurantLegality.numeration_to = this._colombiaLegalityForm.value.numeration_to;

                //info to next resolution
                if (this._restaurantLegalityInEditMode) {
                    this._restaurantLegality.invoice_resolution2 = this._colombiaLegalityForm.value.invoice_resolution_two;
                    this._restaurantLegality.invoice_resolution_date2 = this._colombiaLegalityForm.value.invoice_resolution_date_two;
                    this._restaurantLegality.prefix2 = this._colombiaLegalityForm.value.prefix_two;
                    if (this._restaurantLegality.prefix2) {
                        this._restaurantLegality.prefix_name2 = this._colombiaLegalityForm.value.prefix_name_two;
                        if (this._restaurantLegality.prefix_name2 == null || this._restaurantLegality.prefix_name2 === undefined || this._restaurantLegality.prefix_name2 === '') {
                            this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                                disableClose: true,
                                data: {
                                    title: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.INVALID_DATA'),
                                    subtitle: '',
                                    content: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ENTER_PREFIX'),
                                    buttonCancel: '',
                                    buttonAccept: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ACCEPT'),
                                    showCancel: false
                                }
                            });
                            _validator = false;
                        }
                    } else {
                        this._restaurantLegality.prefix_name2 = null;
                    }
                    this._restaurantLegality.numeration_from2 = this._colombiaLegalityForm.value.numeration_from_two;
                    this._restaurantLegality.numeration_to2 = this._colombiaLegalityForm.value.numeration_to_two;
                } else {
                    this._restaurantLegality.enable_two = false;
                    this._restaurantLegality.current_value = null;
                    this._restaurantLegality.start_new_value = true;
                }
                //info to next resolution

                this._restaurantLegality.text_at_the_end = this._colombiaLegalityForm.value.text_at_the_end;
                if (_validator) {
                    this.colombiaLegality.emit(this._restaurantLegality);
                } else {
                    this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                        disableClose: true,
                        data: {
                            title: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.INVALID_DATA'),
                            subtitle: '',
                            content: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.REQUIRED_FILES'),
                            buttonCancel: '',
                            buttonAccept: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.ACCEPT'),
                            showCancel: false
                        }
                    });
                }
            } else {
                this.colombiaLegality.emit(this._restaurantLegality);
            }
        } else {
            this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
                disableClose: true,
                data: {
                    title: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.INVALID_DATA'),
                    subtitle: '',
                    content: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.INVALID_DATA'),
                    buttonCancel: '',
                    buttonAccept: this.itemNameTraduction('RESTAURANT_LEGALITY.COLOMBIA.SELECT_REGIME'),
                    showCancel: false
                }
            });
        }
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
     * Emit action to come back in tabs
     */
    previousTab(): void {
        this.previous.emit(true);
    }

    /**
     * Emit action to cancel edition
     */
    cancelEdition(): void {
        this.cancel.emit(true);
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}