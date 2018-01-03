import { Component, NgZone } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { SignupComponent } from '../signup/signup';
import { SigninComponent } from '../signin/signin';

@Component({
    selector: 'page-initial',
    templateUrl: 'initial.html'
})

export class InitialComponent {

    userLang: string;

    constructor(public zone: NgZone, public navCtrl: NavController, public translate: TranslateService) {
        this.userLang = navigator.language.split('-')[0];
        translate.setDefaultLang('en');
        translate.use(this.userLang);

    }

    goToSignUp() {
        this.navCtrl.push(SignupComponent);
    }

    goToSignIn() {
        this.navCtrl.push(SigninComponent);
    }
}
