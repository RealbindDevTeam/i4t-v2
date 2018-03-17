import { Component, OnInit, OnDestroy, Input, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Tables } from '../../../../../../../../both/collections/establishment/table.collection';
import { UserLanguageService } from '../../../../services/general/user-language.service';

@Component({
    selector: 'establishment-info',
    templateUrl: './establishment-info.component.html',
    styleUrls: ['./establishment-info.component.scss']
})
export class EstablishmentInfoComponent implements OnInit, OnDestroy {

    @Input() establishmentId: string;
    @Input() tableQRCode: string;

    public _dialogRef: MatDialogRef<any>;
    private _tableNumber: number;
    private _showTableInfo: boolean = true;

    private _establishmentSub: Subscription;
    private _tablesSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishments: Observable<Establishment[]>;

    /**
     * EstablishmentInfoComponent Constructor
     * @param {TranslateService} _translate 
     * @param {MatDialog} _dialog
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _translate: TranslateService,
        public _dialog: MatDialog,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentSub = MeteorObservable.subscribe('getEstablishmentById', this.establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ _id: this.establishmentId }).zone();
            });
        });
        if (this.tableQRCode !== null && this.tableQRCode !== undefined && this.tableQRCode !== '') {
            this._showTableInfo = true;
            this._tablesSub = MeteorObservable.subscribe('getTableByQRCode', this.tableQRCode).takeUntil(this._ngUnsubscribe).subscribe(() => {
                this._ngZone.run(() => {
                    this._tableNumber = Tables.collection.findOne({ QR_code: this.tableQRCode })._number;
                });
            });
        } else {
            this._showTableInfo = false;
        }
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}