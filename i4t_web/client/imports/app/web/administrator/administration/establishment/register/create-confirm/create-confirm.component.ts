import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription, Subject } from 'rxjs';
import { BagPlan } from '../../../../../../../../../both/models/points/bag-plan.model';
import { BagPlans } from '../../../../../../../../../both/collections/points/bag-plans.collection';

@Component({
    selector: 'create-confirm',
    templateUrl: './create-confirm.component.html',
    styleUrls: ['./create-confirm.component.scss']
})
export class CreateConfirmComponent implements OnInit, OnDestroy {

    private _parameterSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

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

    }

    getValuePoints(): number {
        let _lBagPlan: BagPlan = BagPlans.findOne({ _id: "100" });
        if (_lBagPlan) {
            return _lBagPlan.value_points;
        }
    }

    getBagPlanLabel(): string {
        let _lBagPlan: BagPlan = BagPlans.findOne({ _id: "100" });
        if (_lBagPlan) {
            return _lBagPlan.label;
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
    ngOnDestroy() {
    }
}