import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Invoice } from 'i4t_web/both/models/restaurant/invoice.model';
import { UserLanguageServiceProvider } from '../../../../../providers/user-language-service/user-language-service';

@Component({
    selector: 'payments-history-detail-page',
    templateUrl: 'payments-history-detail.html'
})
export class PaymentsHistoryDetailPage implements OnInit, OnDestroy {
    
    private _invoice : Invoice;
    /**
     * PaymentsHistoryDetailPage constructor
     * @param _navParams 
     * @param _navCtrl 
     * @param _translate 
     * @param _userLanguageService 
     */    
    constructor( public _navParams : NavParams,
                 public _navCtrl   : NavController,
                 public _translate: TranslateService,
                 private _userLanguageService: UserLanguageServiceProvider ){
        this._invoice = this._navParams.get("invoice");
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
    }

    /**
     * This function validates if string crop
     * @param { string } _pItemName 
     */
    itemNameCrop( _pItemName : string ) : string{
        if( _pItemName.length > 20 && _pItemName.indexOf(' ') <= 0 ) {
            return _pItemName.substring(1, 20) + '...';
        } else {
            return _pItemName;
        }
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {

    }
}