import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { MatSnackBar } from '@angular/material';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../../services/general/user-language.service';
import { generateQRCode, createTableCode } from '../../../../../../../../../both/methods/restaurant/restaurant.methods';
import { DisableConfirmComponent } from '../disable-confirm/disable-confirm.component';
import { Restaurant } from '../../../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../../../../both/collections/restaurant/restaurant.collection';
import { Table } from '../../../../../../../../../both/models/restaurant/table.model';
import { Tables } from '../../../../../../../../../both/collections/restaurant/table.collection';
import { AlertConfirmComponent } from '../../../../../../web/general/alert-confirm/alert-confirm.component';
import { Country } from '../../../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../../../both/collections/general/country.collection';

import * as QRious from 'qrious';

@Component({
    selector: 'enable-disable',
    templateUrl: './enable-disable.component.html',
    styleUrls: ['./enable-disable.component.scss']
})
export class EnableDisableComponent implements OnInit, OnDestroy {

    @Input()
    restaurantId: string;

    @Output('gotorestaurantlist')
    restaurantStatus: EventEmitter<any> = new EventEmitter<any>();

    private _tableForm: FormGroup;
    private _restaurantSub: Subscription;
    private _tableSub: Subscription;
    private _countrySub: Subscription;

    private _restaurants: Observable<Restaurant[]>;
    private _tables: Observable<Table[]>;

    private titleMsg: string;
    private btnAcceptLbl: string;
    private selectedRestaurantValue: string;
    private restaurantCode: string = '';
    private tables_count: number = 0;
    private max_table_number: number;
    private _restaurant: Restaurant;

    private _mdDialogRef: MatDialogRef<any>;

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
        private _ngZone: NgZone) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
        this.selectedRestaurantValue = "";
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    ngOnInit() {
        this.removeSubscriptions();
        this._tableForm = new FormGroup({
            tables_number: new FormControl('', [Validators.required])
        });
        this._restaurantSub = MeteorObservable.subscribe('restaurants', Meteor.userId()).subscribe(() => {
            this._ngZone.run(() => {
                this._restaurants = Restaurants.find({ _id: this.restaurantId }).zone();
                this._restaurant = Restaurants.findOne({ _id: this.restaurantId });
                this._countrySub = MeteorObservable.subscribe('getCountryByRestaurantId', this.restaurantId).subscribe(() => {
                    this._ngZone.run(() => {
                        let _lRestaurantCountry: Country = Countries.findOne({ _id: this._restaurant.countryId });
                        this.max_table_number = _lRestaurantCountry.max_number_tables;
                        this._tableForm.controls['tables_number'].setValidators(Validators.max(this.max_table_number));
                    });
                });
            });
        });
        this._tableSub = MeteorObservable.subscribe('tables', Meteor.userId()).subscribe(() => {
            this._ngZone.run(() => {
                this._tables = this._tables = Tables.find({ restaurantId: this.restaurantId }).zone();
            });
        });
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._restaurantSub) { this._restaurantSub.unsubscribe(); }
        if (this._tableSub) { this._tableSub.unsubscribe(); }
        if (this._countrySub) { this._countrySub.unsubscribe(); }
    }

    /**
     * This function adds the number indicated of tables to the restaurant
     */
    addTables() {
        let snackMsg: string = this.itemNameTraduction('MONTHLY_CONFIG.TABLES_CREATE');

        if (!Meteor.userId()) {
            this.openDialog(this.titleMsg, '', 'LOGIN_SYSTEM_OPERATIONS_MSG', '', this.btnAcceptLbl, false);
            return;
        }

        if (this._tableForm.valid) {
            let _lRestau: Restaurant = Restaurants.findOne({ _id: this.restaurantId });
            let _lTableNumber: number = this._tableForm.value.tables_number;
            this.restaurantCode = _lRestau.restaurant_code;
            this.tables_count = Tables.collection.find({ restaurantId: this.restaurantId }).count();

            for (let _i = 0; _i < _lTableNumber; _i++) {
                let _lRestaurantTableCode: string = '';
                let _lTableCode: string = '';

                _lTableCode = this.generateTableCode();

                _lRestaurantTableCode = this.restaurantCode + _lTableCode;
                let _lCodeGenerator = generateQRCode(_lRestaurantTableCode);

                let _lQrCode = new QRious({
                    background: 'white',
                    backgroundAlpha: 1.0,
                    foreground: 'black',
                    foregroundAlpha: 1.0,
                    level: 'H',
                    mime: 'image/svg',
                    padding: null,
                    size: 150,
                    value: _lCodeGenerator.getQRCode()
                });

                let _lNewTable: Table = {
                    creation_user: Meteor.userId(),
                    creation_date: new Date(),
                    restaurantId: this.restaurantId,
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
                    _number: this.tables_count + (_i + 1)
                };
                Tables.insert(_lNewTable);
                Restaurants.update({ _id: this.restaurantId }, { $set: { tables_quantity: _lRestau.tables_quantity + (_i + 1) } })
            }
            this._tableForm.reset();
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
     * This function updates restaurant status and goes to restaurant list component
     * @param {Restaurant} _restaurant
     */
    updateStatus(_restaurant: Restaurant) {

        let titleMsg: string;
        let snackMsg: string = this.itemNameTraduction('MONTHLY_CONFIG.RESTAURANT_MODIFIED');

        if (_restaurant.isActive) {
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
                Restaurants.update({ _id: _restaurant._id }, {
                    $set: {
                        isActive: !_restaurant.isActive,
                        modification_user: Meteor.userId(),
                        modification_date: new Date()
                    }
                });

                Tables.collection.find({ restaurantId: _restaurant._id }).forEach(function <Table>(table, index, ar) {
                    Tables.collection.update({ _id: table._id }, { $set: { is_active: !_restaurant.isActive } });
                });

                this.restaurantStatus.emit(true);
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
     * This function back to de restaurant list
     */
    backToList() {
        this.restaurantStatus.emit(true);
    }
    /**
     * This function cleans the tables_number fields form
     */
    cancel(): void {
        if (this.selectedRestaurantValue !== "") { this.selectedRestaurantValue = ""; }
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

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}