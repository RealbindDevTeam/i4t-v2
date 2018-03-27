import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { UserLanguageService } from '../../../services/general/user-language.service';


@Component({
    selector: 'bags-payment',
    templateUrl: './bags-payment.component.html',
    styleUrls: ['./bags-payment.component.scss']
})

export class BagsPaymentComponent implements OnInit, OnDestroy {

    /**
     * MonthlyPaymentComponent Constructor
     * @param {Router} router 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} translate 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private router: Router,
        private translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
    }

    ngOnInit() {
        
    }
}