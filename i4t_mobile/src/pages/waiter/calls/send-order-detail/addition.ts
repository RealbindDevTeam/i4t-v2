import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';

@Component({
    selector: 'additions-send-order-component',
    templateUrl: 'addition.html'
})

export class AdditionsSendOrderComponent implements OnInit, OnDestroy {

  @Input() addition : string;
  @Input() quantity : number;
  
  private _additionSubscription : Subscription;
  private _additions            : any;
  
  /**
   * AdditionsSendOrderComponent constructor
   */
  constructor(){
  }

  /**
   * ngOnInit Implementation
   */
  ngOnInit(){
    this.removeSubscriptions();
    this._additionSubscription = MeteorObservable.subscribe( 'additionsById', this.addition ).subscribe( () => {
        this._additions = Additions.find({ _id : this.addition });
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
    if( this._additionSubscription ){ this._additionSubscription.unsubscribe(); }
  }
}