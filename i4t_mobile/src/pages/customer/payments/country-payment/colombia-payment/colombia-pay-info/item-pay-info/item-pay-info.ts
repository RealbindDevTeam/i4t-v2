import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Currencies } from 'i4t_web/both/collections/general/currency.collection';
import { Items } from 'i4t_web/both/collections/menu/item.collection';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs';

@Component({
    selector: 'item-pay-info',
    templateUrl: 'item-pay-info.html'
})

export class ItemPayInfoComponent implements OnInit, OnDestroy {

    @Input() itemId     : string;
    @Input() currency   : string;
    @Input() price      : number;
    @Input() quantity   : number;
    private _itemSubscription       : Subscription;
    private _currencySubscription   : Subscription;
    private _items                  : any;

    /**
     * ItemPayInfoComponent constructor
     */
    constructor(){
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit(){
        this.removeSubscriptions();
        this._itemSubscription = MeteorObservable.subscribe('itemById', this.itemId).subscribe(()=>{
            this._items = Items.find({_id : this.itemId});
        });
        this._currencySubscription = MeteorObservable.subscribe('getCurrenciesByCurrentUser', Meteor.userId()).subscribe(() => {});
    }

    getIdCurrency(pCurrency) : string{
        let _lCurrencyCode = Currencies.findOne({code : pCurrency });
        if(_lCurrencyCode){
            return _lCurrencyCode._id;
        } else {
            return "";
        }
    }

    /**
     * ngOnDestroy implimentation
     */
    ngOnDestroy(){
        this.removeSubscriptions();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions():void{
        if( this._itemSubscription ){ this._itemSubscription.unsubscribe(); }
        if( this._currencySubscription ){ this._currencySubscription.unsubscribe(); }
    }
}