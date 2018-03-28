import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../../services/general/user-language.service';
import { generateQRCode, createTableCode } from '../../../../../../../../../both/methods/establishment/establishment.methods';
import { DisableConfirmComponent } from '../disable-confirm/disable-confirm.component';
import { Establishment } from '../../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../../both/collections/establishment/establishment.collection';
import { Table } from '../../../../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../../../../both/collections/establishment/table.collection';
import { AlertConfirmComponent } from '../../../../../../web/general/alert-confirm/alert-confirm.component';
import { Country } from '../../../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../../../both/collections/general/country.collection';
import { Parameter } from "../../../../../../../../../both/models/general/parameter.model";
import { Parameters } from "../../../../../../../../../both/collections/general/parameter.collection";

import * as QRious from 'qrious';

@Component({
    selector: 'enable-disable',
    templateUrl: './enable-disable.component.html',
    styleUrls: ['./enable-disable.component.scss']
})
export class EnableDisableComponent implements OnInit, OnDestroy {


    private _tableForm: FormGroup;
    private _establishmentSub: Subscription;
    private _tableSub: Subscription;
    private _countrySub: Subscription;
    private _parameterSubscription: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishments: Observable<Establishment[]>;
    private _tables: Observable<Table[]>;

    private titleMsg: string;
    private btnAcceptLbl: string;
    private selectedEstablishmentValue: string;
    private establishmentCode: string = '';
    private tables_count: number = 0;
    private max_table_number: number;
    private _establishment: Establishment;

    private _mdDialogRef: MatDialogRef<any>;
    private establishmentId: string;
    private _remaining_tables: number;

    /**
     * EnableDisableComponent Constructor
     * @param {TranslateService} translate 
     * @param {MatSnackBar} snackBar 
     * @param {MatDialog} _mdDialog 
     * @param {UserLanguageService} _userLanguageService 
     * @param {NgZone} _ngZone
     */
    constructor(private translate: TranslateService,
        public snackBar: MatSnackBar,
        public _mdDialog: MatDialog,
        private _userLanguageService: UserLanguageService,
        private _ngZone: NgZone,
        private _activateRoute: ActivatedRoute,
        private _router: Router) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
        this.selectedEstablishmentValue = "";
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';

        this._activateRoute.params.forEach((param: Params) => {
            this.establishmentId = param['param1'];
        });
    }

    ngOnInit() {
        this.removeSubscriptions();
        this._tableForm = new FormGroup({
            tables_number: new FormControl('', [Validators.required])
        });
        this._establishmentSub = MeteorObservable.subscribe('establishments', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ _id: this.establishmentId }).zone();
                this._establishment = Establishments.findOne({ _id: this.establishmentId });
                this._countrySub = MeteorObservable.subscribe('getCountryByEstablishmentId', this.establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        let _lEstablishmentCountry: Country = Countries.findOne({ _id: this._establishment.countryId });
                        this.max_table_number = _lEstablishmentCountry.max_number_tables;
                        this._remaining_tables = this.max_table_number - this._establishment.tables_quantity;
                        this._tableForm.controls['tables_number'].setValidators(Validators.max(this._remaining_tables));
                    });
                });
            });
        });
        this._tableSub = MeteorObservable.subscribe('tables', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._tables = this._tables = Tables.find({ establishment_id: this.establishmentId }).zone();
            });
        });
        this._parameterSubscription = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Get the remaining tables of establishment
     */
    getRemainingTables() {
        this._remaining_tables = this.max_table_number - this._establishment.tables_quantity;
    }

    /**
     * This function adds the number indicated of tables to the establishment
     */
    addTables() {
        let snackMsg: string = this.itemNameTraduction('MONTHLY_CONFIG.TABLES_CREATE');

        if (!Meteor.userId()) {
            this.openDialog(this.titleMsg, '', 'LOGIN_SYSTEM_OPERATIONS_MSG', '', this.btnAcceptLbl, false);
            return;
        }

        if (this._tableForm.valid) {
            let _lEstablishment: Establishment = Establishments.findOne({ _id: this.establishmentId });
            let _lTableNumber: number = this._tableForm.value.tables_number;
            let _lParameterUrl: Parameter = Parameters.collection.findOne({ _id: "50000" });

            this.establishmentCode = _lEstablishment.establishment_code;
            this.tables_count = Tables.collection.find({ establishment_id: this.establishmentId }).count();
            let _lUrl: string = _lParameterUrl.value;

            for (let _i = 0; _i < _lTableNumber; _i++) {
                let _lEstablishmentTableCode: string = '';
                let _lTableCode: string = '';

                _lTableCode = this.generateTableCode();

                _lEstablishmentTableCode = this.establishmentCode + _lTableCode;
                let _lCodeGenerator = generateQRCode(_lEstablishmentTableCode);
                let _lUriRedirect: string = _lUrl + _lCodeGenerator.getQRCode();

                let _lQrCode = new QRious({
                    background: 'white',
                    backgroundAlpha: 1.0,
                    foreground: 'black',
                    foregroundAlpha: 1.0,
                    level: 'M',
                    mime: 'image/svg',
                    padding: null,
                    size: 150,
                    value: _lUriRedirect
                });

                let _lNewTable: Table = {
                    creation_user: Meteor.userId(),
                    creation_date: new Date(),
                    establishment_id: this.establishmentId,
                    table_code: _lTableCode,
                    is_active: true,
                    QR_code: _lCodeGenerator.getQRCode(),
                    QR_information: {
                        significativeBits: _lCodeGenerator.getSignificativeBits(),
                        bytes: _lCodeGenerator.getFinalBytes()
                    },
                    amount_people: 0,
                    status: 'FREE',
                    QR_URI: _lQrCode.toDataURL(),
                    _number: this.tables_count + (_i + 1),
                    uri_redirect: _lUriRedirect,
                };
                Tables.insert(_lNewTable);
                Establishments.update({ _id: this.establishmentId }, { $set: { tables_quantity: _lEstablishment.tables_quantity + (_i + 1) } })
            }
            this._tableForm.reset();
            let establishment_remaining: Establishment = Establishments.findOne({ _id: this.establishmentId });
            this._remaining_tables = this.max_table_number - establishment_remaining.tables_quantity;
            this._tableForm.controls['tables_number'].setValidators(Validators.max(this._remaining_tables));
            this.snackBar.open(snackMsg, '', {
                duration: 1500,
            });
        }
    }

    /**
     * This function generates de table code
     * @return {string}
     */
    generateTableCode(): string {
        let _lCode: string = '';

        while (true) {
            _lCode = createTableCode();
            if (Tables.find({ table_code: _lCode }).cursor.count() === 0) {
                break;
            }
        }
        return _lCode;
    }

    /**
     * This function gets the table status
     * @param {Table} _table
     * @return {string}
     */
    getTableStatus(_table: Table): string {
        if (_table.is_active === true) {
            return 'MONTHLY_CONFIG.STATUS_ACTIVE';
        } else {
            return 'MONTHLY_CONFIG.STATUS_INACTIVE';
        }
    }

    /**
     * This function updates table status
     * @param {Table} _table
     */
    updateTableStatus(_table: Table) {
        let snackMsg: string = this.itemNameTraduction('MONTHLY_CONFIG.TABLE_MODIFIED');
        Tables.update({ _id: _table._id }, {
            $set: {
                is_active: !_table.is_active,
                modification_date: new Date(),
                modification_user: Meteor.userId()
            }
        });
        this.snackBar.open(snackMsg, '', {
            duration: 1000,
        });
    }

    /**
     * This function updates establishment status and goes to establishment list component
     * @param {Establishment} _establishment
     */
    updateStatus(_establishment: Establishment) {

        let titleMsg: string;
        let snackMsg: string = this.itemNameTraduction('MONTHLY_CONFIG.RESTAURANT_MODIFIED');

        if (_establishment.isActive) {
            titleMsg = 'MONTHLY_CONFIG.DIALOG_INACTIVATE';
        } else {
            titleMsg = 'MONTHLY_CONFIG.DIALOG_ACTIVATE';
        }

        this._mdDialogRef = this._mdDialog.open(DisableConfirmComponent, {
            disableClose: true,
            data: titleMsg
        });

        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;

            if (result.success) {
                Establishments.update({ _id: _establishment._id }, {
                    $set: {
                        isActive: !_establishment.isActive,
                        modification_user: Meteor.userId(),
                        modification_date: new Date()
                    }
                });

                Tables.collection.find({ establishment_id: _establishment._id }).forEach(function <Table>(table, index, ar) {
                    Tables.collection.update({ _id: table._id }, { $set: { is_active: !_establishment.isActive } });
                });
                this.snackBar.open(snackMsg, '', {
                    duration: 1500,
                });
            }
        });
    }

    /**
     * This function cleans the tables_number fields form
     * @param {string} itemName
     * @return {string}
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this.translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * This function cleans the tables_number fields form
     */
    cancel(): void {
        if (this.selectedEstablishmentValue !== "") { this.selectedEstablishmentValue = ""; }
        this._tableForm.controls['tables_number'].reset();
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

    backToList() {
        this._router.navigate(['app/establishment-list']);
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}