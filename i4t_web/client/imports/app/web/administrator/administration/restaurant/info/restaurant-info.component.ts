import { Component, OnInit, OnDestroy, Input, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { Restaurant } from '../../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../../../both/collections/restaurant/restaurant.collection';
import { Tables } from '../../../../../../../../both/collections/restaurant/table.collection';
import { UserLanguageService } from '../../../../services/general/user-language.service';

@Component({
    selector: 'restaurant-info',
    templateUrl: './restaurant-info.component.html',
    styleUrls: ['./restaurant-info.component.scss']
})
export class RestaurantInfoComponent implements OnInit, OnDestroy {

    @Input() restaurantId: string;
    @Input() tableQRCode: string;

    public _dialogRef: MatDialogRef<any>;
    private _tableNumber: number;
    private _showTableInfo: boolean = true;

    private _restaurantSub: Subscription;
    private _tablesSub: Subscription;

    private _restaurants: Observable<Restaurant[]>;

    /**
     * RestaurantInfoComponent Constructor
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
        this._restaurantSub = MeteorObservable.subscribe('getRestaurantById', this.restaurantId).subscribe(() => {
            this._ngZone.run(() => {
                this._restaurants = Restaurants.find({ _id: this.restaurantId }).zone();
            });
        });
        if (this.tableQRCode !== null && this.tableQRCode !== undefined && this.tableQRCode !== '') {
            this._showTableInfo = true;
            this._tablesSub = MeteorObservable.subscribe('getTableByQRCode', this.tableQRCode).subscribe(() => {
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
        if (this._restaurantSub) { this._restaurantSub.unsubscribe(); }
        if (this._tablesSub) { this._tablesSub.unsubscribe(); }
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}