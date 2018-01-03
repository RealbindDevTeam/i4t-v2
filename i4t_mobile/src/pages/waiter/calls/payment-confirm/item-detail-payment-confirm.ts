import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs';
import { Items } from 'i4t_web/both/collections/menu/item.collection';

@Component({
    selector: 'item-detail-payment-confirm',
    templateUrl: 'item-detail-payment-confirm.html'
})

export class ItemDetailPaymentConfirmComponent implements OnInit, OnDestroy {

  @Input() itemId      : string;
  @Input() currency    : string;
  @Input() quantity    : number;
  @Input() paymentItem : number;

  private _itemSubscription : Subscription;
  private _items            : any;

  /**
   * ItemDetailPaymentConfirmComponent constructor
   */
  constructor(){
  }

  /**
   * ngOnInit Implementation
   */
  ngOnInit(){
    this.removeSubscriptions();
    this._itemSubscription = MeteorObservable.subscribe('itemById', this.itemId).subscribe(() => {
        this._items = Items.find({ _id : this.itemId });
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
    if( this._itemSubscription ){ this._itemSubscription.unsubscribe(); }
  }

}