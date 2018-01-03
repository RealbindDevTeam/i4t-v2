import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs';

@Component({
    selector: 'addition-pay-info',
    templateUrl: 'addition-pay-info.html'
})

export class AdditionPayInfoComponent implements OnInit, OnDestroy {

    @Input() additionId : string;
    @Input() currency   : string;
    @Input() price      : number;
    @Input() quantity   : number;
    private _additionSubscription : Subscription;
    private _additions            : any;

    /**
     * AdditionPayInfoComponent constructor
     */
    constructor(){
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit(){
        this.removeSubscriptions();
        this._additionSubscription = MeteorObservable.subscribe('additionsById', this.additionId).subscribe(()=>{
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
        if( this._additionSubscription ){ this._additionSubscription.unsubscribe(); }
    }
}