import { Component, NgZone } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AlertController, NavController, NavParams, ViewController } from 'ionic-angular';

@Component({
    selector: 'page-lightbox',
    templateUrl: 'lightbox.html'
})
export class LightboxPage {
    private _img: string = "";
    
    /**
     * LightboxPage constructor
     * @param params 
     * @param viewCtrl 
     */
    constructor(public params: NavParams,
        public viewCtrl: ViewController) {
        this._img = params.get('item_img');
    }

    /** 
     * Dismiss component
     */
    dismiss() {
        this.viewCtrl.dismiss();
    }
}