import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs';
import { Orders } from 'i4t_web/both/collections/restaurant/order.collection';

@Component({
    selector: 'payment-detail-confirm',
    templateUrl: 'payment-detail-confirm.html'
})

export class PaymentDetailConfirmComponent implements OnInit, OnDestroy {

  @Input() orderId           : string;
  @Input() currency          : string;
  
  private _orderSubscription   : Subscription;
  private _orders              : any;
  private _orderIndex          : number = -1;

  /**
   * PaymentDetailConfirmComponent constructor
   */
  constructor(){
  }

  /**
   * ngOnInit Implementation
   */
  ngOnInit(){
    this.removeSubscriptions();
    this._orderSubscription = MeteorObservable.subscribe('getOrderById', this.orderId).subscribe(()=>{
      this._orders = Orders.find({ _id: this.orderId });
    });
  }

  /**
   * Allow view div correspondly to order detail
   * @param i 
   */
  showDetail(i) {
    if (this._orderIndex == i) {
      this._orderIndex = -1;
    } else {
      this._orderIndex = i;
    }
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
    if( this._orderSubscription ){ this._orderSubscription.unsubscribe(); }
  }

}