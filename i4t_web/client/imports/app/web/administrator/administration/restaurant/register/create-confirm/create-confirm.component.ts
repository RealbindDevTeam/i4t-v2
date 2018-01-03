import { Component, NgZone, OnInit, OnDestroy} from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription } from 'rxjs';
import { Parameter } from '../../../../../../../../../both/models/general/parameter.model';
import { Parameters } from '../../../../../../../../../both/collections/general/parameter.collection';

@Component({
    selector: 'create-confirm',
    templateUrl: './create-confirm.component.html',
    styleUrls: [ './create-confirm.component.scss' ]
})
export class CreateConfirmComponent implements OnInit, OnDestroy{

     private _parameterSub: Subscription;

    /**
     * CreateConfirmComponent constructor
     * @param {MatDialogRef<any>} _dialogRef
     */
    constructor(public _dialogRef: MatDialogRef<any>, private _zone: NgZone) {
        
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._parameterSub = MeteorObservable.subscribe('getParameters').subscribe();
    }

    /**
     * Remove all Subscriptions
     */
    removeSubscriptions():void{
        if( this._parameterSub ){ this._parameterSub.unsubscribe(); }
    }

    getDiscountPercent(){
        let discount = Parameters.findOne({name: 'first_pay_discount'});
        if(discount){
            return discount.value;
        }
    }

    /**
     * Function to gets de first day of charge
     */
    getFirstDay(): string{
        let firstDay = Parameters.findOne({ name: 'start_payment_day' });
        if(firstDay){
            return firstDay.value;
        }
    }

    /**
     * Function that returns true to Parent component
     */
    closeConfirm() {
        this._dialogRef.close({ success: true });
    }

    /**
     * This function allow closed the modal dialog
     */
    cancel() {
        this._dialogRef.close({ success: false });
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy(){
        this.removeSubscriptions();
    }
}