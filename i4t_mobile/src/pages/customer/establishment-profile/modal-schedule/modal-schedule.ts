import { Component, OnInit, NgZone } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { Observable } from 'rxjs';
import { Establishment, EstablishmentProfile } from 'i4t_web/both/models/establishment/establishment.model';
import { Establishments, EstablishmentsProfile } from 'i4t_web/both/collections/establishment/establishment.collection';

@Component({
    selector: 'modal-schedule',
    templateUrl: './modal-schedule.html'
})
export class ModalSchedule implements OnInit {

    private _establishmentsProfiles: Observable<EstablishmentProfile[]>;;
    private _establishmentsProfile: EstablishmentProfile;
    private _establishment: Establishment = null;

    /**
     * ModalSchedule constructor
     * @param _navParams 
     * @param _viewCtrl 
     * @param _ngZone 
     */
    constructor(public _navParams: NavParams,
        public _viewCtrl: ViewController,
        private _ngZone: NgZone) {
        this._establishment = this._navParams.get("establishment");
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._ngZone.run(() => {
            this._establishmentsProfiles = EstablishmentsProfile.find({ establishment_id: this._establishment._id }).zone();
            this._establishmentsProfiles.subscribe(() => {
                this._establishmentsProfile = EstablishmentsProfile.findOne({ establishment_id: this._establishment._id });
            });
        });
    }

    /**
     * Close the modal
     */
    close() {
        this._viewCtrl.dismiss();
    }

}