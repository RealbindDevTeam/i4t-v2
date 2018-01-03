import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { MeteorObservable } from 'meteor-rxjs';
import { PageScrollService, PageScrollInstance, PageScrollConfig } from 'ngx-page-scroll';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { Language } from '../../../../../both/models/general/language.model';
import { Languages } from '../../../../../both/collections/general/language.collection';

@Component({
    selector: 'landing-page',
    templateUrl: './landing-page.component.html',
    styleUrls: [ './landing-page.component.scss' ]
})
export class LandingPageComponent implements OnInit, OnDestroy {

    private _languages    : Observable<Language[]>;
    private _subscription : Subscription;

    private _showIconMenu : boolean = true;
    private _userLang     : string  = "";

    /**
     * LandingPageComponent Constructor
     * @param {any} document 
     * @param {PageScrollService} pageScrollService 
     * @param {TranslateService} translate 
     */
    constructor( @Inject(DOCUMENT) private document: any,
                 private pageScrollService: PageScrollService,
                 private translate: TranslateService) {
        PageScrollConfig.defaultScrollOffset = 64;
        PageScrollConfig.defaultDuration = 900; 
        
        this._userLang = navigator.language.split('-')[0];
        translate.setDefaultLang('en');
        translate.use( this._userLang );
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy(){
        this.removeSubscriptions();
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit(){
        this.removeSubscriptions();
        this._languages = Languages.find({}).zone();
        this._subscription = MeteorObservable.subscribe('languages').subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions():void{
        if( this._subscription ){ this._subscription.unsubscribe(); }
    }

    /**
     * Go to section
     * @param _pSection 
     * @param _pMobileFlag 
     */
    goToSection( _pSection : string, _pMobileFlag : boolean ) {
        let pageScrollInstance: PageScrollInstance = PageScrollInstance.simpleInstance(this.document, "#" + _pSection);
        this.pageScrollService.start(pageScrollInstance);
        if(_pMobileFlag) this.openNav();
    }

    /**
     * Open sidenav
     */
    openNav(){
        document.getElementById("sidenav-dev").classList.remove('active-sidenav');
        document.getElementById("sidenav-bg").classList.remove('active-sidenav-bg');
        
        if(this._showIconMenu){
            document.getElementById("sidenav-dev").classList.add('active-sidenav');
            document.getElementById("sidenav-bg").classList.add('active-sidenav-bg');
        }

        this._showIconMenu = !this._showIconMenu;
    }

    /**
     * Language change
     * @param lang 
     */
    langChange(lang) {
        this._userLang = lang;
        this.translate.use(lang);
    }

}