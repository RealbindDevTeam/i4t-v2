import { Component } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';

@Component({
  templateUrl: 'modal-observations.html',
  selector: 'modal-observations'
})

export class ModalObservations {

  _observations: string;

  constructor(public viewCtrl: ViewController, 
              public _translate: TranslateService, 
              public _params: NavParams,
              private _userLanguageService: UserLanguageServiceProvider) {
    _translate.setDefaultLang('en');
    this._translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
    this._observations = this._params.get('obs');
  }

  closeNormal(){
    this.viewCtrl.dismiss();
  }

  closeObservations() {
    this.viewCtrl.dismiss(this._observations);
  }

}