import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs';
import { Items } from 'i4t_web/both/collections/menu/item.collection'; 

@Component({
    selector: 'item-detail-send-order-component',
    templateUrl: 'item-detail-send-order.html'
})

export class ItemDetailSendOrderComponent implements OnInit, OnDestroy {

  @Input() item : any;
  
  private _itemsSubscription : Subscription;
  private _items             : any;

  /**
   * ItemDetailSendOrderComponent constructor
   */
  constructor(){
  }

  /**
   * ngOnInit Implementation
   */
  ngOnInit(){
    this.removeSubscriptions();
    this._itemsSubscription = MeteorObservable.subscribe( 'itemById', this.item.itemId ).subscribe( () => {
        this._items = Items.find({_id: this.item.itemId});
    });
  }

  /**
   * ngOnDestroy Implementation
   */
  ngOnDestroy(){
    this.removeSubscriptions();
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions():void{
    if( this._itemsSubscription ){ this._itemsSubscription.unsubscribe(); }
  }

}