import { Component, NgZone } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AlertController, NavController, NavParams, ViewController } from 'ionic-angular';

@Component({
    selector: 'page-lightbox',
    templateUrl: 'lightbox.html'
})
export class LightboxPage {
    private _img: string = "";

    constructor(public params: NavParams,
        public viewCtrl: ViewController) {
        this._img = params.get('item_img');
    }

    dismiss(_pDismiss: boolean) {
        if(_pDismiss){
            this.viewCtrl.dismiss();
        }
    }

    prueba() {
        console.log('Hola');
        return false;
    }
}