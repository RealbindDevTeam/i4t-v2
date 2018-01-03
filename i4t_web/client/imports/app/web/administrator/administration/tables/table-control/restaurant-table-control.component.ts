import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Router } from "@angular/router";
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Restaurant } from '../../../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from '../../../../../../../../both/collections/restaurant/restaurant.collection';
import { Table } from '../../../../../../../../both/models/restaurant/table.model';
import { Tables } from '../../../../../../../../both/collections/restaurant/table.collection';
import { UserDetails } from '../../../../../../../../both/collections/auth/user-detail.collection';
import { Orders } from '../../../../../../../../both/collections/restaurant/order.collection';
import { Account } from '../../../../../../../../both/models/restaurant/account.model';
import { Accounts } from '../../../../../../../../both/collections/restaurant/account.collection';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { Users} from '../../../../../../../../both/collections/auth/user.collection';
import { TableDetailComponent } from './table-detail/table-detail.component';

@Component({
    selector: 'restaurant-table-control',
    templateUrl: './restaurant-table-control.component.html',
    styleUrls: [ './restaurant-table-control.component.scss' ]
})
export class RestaurantTableControlComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();

    private _restaurantsSub         : Subscription;
    private _tablesSub              : Subscription;
    private _userDetailsSub         : Subscription;
    private _accountsSub            : Subscription;
    private _ordersSub              : Subscription;
    private _currenciesSub          : Subscription;

    private _restaurants            : Observable<Restaurant[]>;
    private _restaurantsFilter      : Observable<Restaurant[]>;
    private _tables                 : Observable<Table[]>;

    private _thereAreRestaurants    : boolean = true;

    /**
     * RestaurantTableControlComponent Constructor
     * @param {Router} _router 
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor( private _router: Router,
                 private _translate: TranslateService,
                 private _ngZone: NgZone,
                 private _userLanguageService: UserLanguageService ){
        _translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
        _translate.setDefaultLang( 'en' );
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit(){
        this.removeSubscriptions();
        this._restaurantsSub = MeteorObservable.subscribe( 'restaurants', this._user ).subscribe( () => {
            this._ngZone.run( () => {
                this._restaurantsFilter = Restaurants.find( { } ).zone();
                this._restaurants = Restaurants.find( { } ).zone();
                this.countRestaurants();
                this._restaurants.subscribe( () => { this.countRestaurants(); });
            });
        });
        this._tablesSub = MeteorObservable.subscribe( 'tables', this._user ).subscribe( () => {
            this._ngZone.run( () => {
                this._tables = Tables.find( { } ).zone();
            });
        });
        this._ordersSub = MeteorObservable.subscribe( 'getOrdersByAdminUser', this._user, ['ORDER_STATUS.REGISTERED', 'ORDER_STATUS.IN_PROCESS', 
                                                                                           'ORDER_STATUS.PREPARED', 'ORDER_STATUS.DELIVERED',
                                                                                           'ORDER_STATUS.PENDING_CONFIRM'] ).subscribe();
        this._accountsSub = MeteorObservable.subscribe( 'getAccountsByAdminUser', this._user ).subscribe();
        this._currenciesSub = MeteorObservable.subscribe( 'getCurrenciesByUserId', this._user ).subscribe();
        this._userDetailsSub = MeteorObservable.subscribe( 'getUserDetailsByAdminUser', this._user ).subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions():void{
        if( this._restaurantsSub ){ this._restaurantsSub.unsubscribe(); }
        if( this._tablesSub ){ this._tablesSub.unsubscribe(); }
        if( this._userDetailsSub ){ this._userDetailsSub.unsubscribe(); }
        if( this._accountsSub ){ this._accountsSub.unsubscribe(); }
        if( this._ordersSub ){ this._ordersSub.unsubscribe(); }
        if( this._currenciesSub ){ this._currenciesSub.unsubscribe(); }
    }

    /**
     * Return restaurant currency
     * @param {string} _pRestaurantCurrency 
     */
    getRestaurantCurrency( _pRestaurantCurrency:string ):string{
        let _lCurrency:Currency = Currencies.findOne( { _id: _pRestaurantCurrency } );
        if( _lCurrency ){
            return _lCurrency.code;
        }
    }

    /**
     * Change Restaurant Filter
     * @param {string} _pRestaurantId 
     */
    changeRestaurantFilter (_pRestaurantId:string ) {
        if ( _pRestaurantId === 'All' ) {
            this._restaurants = Restaurants.find( { } ).zone();
        } else {
            this._restaurants = Restaurants.find( { _id: _pRestaurantId } ).zone();
        }
      }

    /**
     * Validate if restaurants exists
     */
    countRestaurants(): void {
        Restaurants.collection.find({}).count() > 0 ? this._thereAreRestaurants = true : this._thereAreRestaurants = false;
    }

    /**
     * Return total payment account
     * @param {string} _pRestaurantId
     * @param {string} _pTableId 
     */
    getPaymentAccount( _pRestaurantId:string, _pTableId:string ):number{
        let _lAccount:Account = Accounts.findOne( { restaurantId: _pRestaurantId, tableId: _pTableId } );
        if( _lAccount ){
            return _lAccount.total_payment;
        }
    }

    /**
     * Return table orders count
     * @param {string} _pRestaurantId 
     * @param {string} _pTableId 
     */
    getTableOrders( _pRestaurantId:string, _pTableId:string ):number{
        return Orders.collection.find( { restaurantId: _pRestaurantId, tableId: _pTableId } ).count();
    }

    /**
     * Get Users in restaurant
     * @param {string} _pRestaurantId
     */
    getRestaurantUsers( _pRestaurantId:string ):number{
        return UserDetails.collection.find( { current_restaurant: _pRestaurantId } ).count();
    }

    /**
     * Go To Add Restaurant Component
     */
    goToAddRestaurant():void{
        this._router.navigate(['/app/restaurant-register']);
    }

    /**
     * Open Table Detail Dialog
     * @param {string} _pRestaurantId
     * @param {string} _pTableId
     * @param {string} _pTableNumber
     * @param {string} _pCurrencyId
     */
    openTableDetail( _pRestaurantId:string, _pTableId:string, _pTableNumber:string, _pCurrencyId:string ) {
        this._router.navigate( [ 'app/table-detail', _pRestaurantId, _pTableId, _pTableNumber, _pCurrencyId, '100' ], { skipLocationChange: true } );
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy(){
        this.removeSubscriptions();
    }
}