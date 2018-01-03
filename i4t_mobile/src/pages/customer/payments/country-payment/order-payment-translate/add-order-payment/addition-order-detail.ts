import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs';

@Component({
    selector: 'addition-order-detail',
    templateUrl: 'addition-order-detail.html'
})

export class AdditionOrderDetailComponent implements OnInit, OnDestroy {

    @Input() additionId : string;
    @Input() currency   : string;
    @Input() price      : number;
    @Input() quantity   : number;
    private _additionsSubscription : Subscription;
    private _additions             : any;

    /**
     * AdditionOrderDetailComponent constructor
     */
    constructor(){
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit(){
        this.removeSubscriptions();
        this._additionsSubscription = MeteorObservable.subscribe('additionsById', this.additionId).subscribe(()=>{
            this._additions = Additions.find({_id : this.additionId});
        });
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
    if( this._additionsSubscription ){ this._additionsSubscription.unsubscribe(); }
  }
}