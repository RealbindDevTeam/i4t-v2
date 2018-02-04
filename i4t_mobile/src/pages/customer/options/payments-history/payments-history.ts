import { Component, NgZone,OnInit, OnDestroy } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs';
//import { Invoice } from 'i4t_web/both/models/establishment/invoice.model';
//import { Invoices } from 'i4t_web/both/collections/establishment/invoice.collection';
import { Parameters } from 'i4t_web/both/collections/general/parameter.collection';
import { PaymentsHistoryDetailPage } from "./payments-history-detail/payments-history-detail";
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';

@Component({
  selector: 'payments-history-page',
  templateUrl: 'payments-history.html'
})
export class PaymentsHistoryPage implements OnInit, OnDestroy {
  
  private _invoicesHistorySubscription : Subscription;
  private _parameterSubscription       : Subscription;
  private _invoices      : any;
  private _ionicUrlParam : any;
  
  /**
   * PaymentsHistoryPage constructor
   * @param _navCtrl 
   * @param _translate 
   * @param _userLanguageService 
   */
  constructor(public _navCtrl : NavController,
              public _translate: TranslateService,
              private _userLanguageService: UserLanguageServiceProvider,
              private _ngZone : NgZone){
    _translate.setDefaultLang('en');
  }

  /**
   * ngOnInit Implementation
   */
  ngOnInit(){
    this._translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
    this.removeSubscriptions();
    this._invoicesHistorySubscription = MeteorObservable.subscribe('getInvoicesByUserId', Meteor.userId()).subscribe(()=> {
      //this._invoices = Invoices.find({});
    });

    this._parameterSubscription = MeteorObservable.subscribe('getParameters').subscribe(()=>{
      this._ngZone.run(()=>{
        this._ionicUrlParam = Parameters.findOne({_id : '1600'});
      });
    });
  }

  /**
   * This function allow go to PaymentsHistoryDetailPage component
   * @param {Invoice} _pInvoice 
   */
  goToPaymentDetail( _pInvoice : any ){
    this._navCtrl.push(PaymentsHistoryDetailPage, { invoice : _pInvoice });
  }

  /**
   * ngOnDestroy implementation
   */
  ngOnDestroy(){
    this.removeSubscriptions();
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions():void{
    if( this._invoicesHistorySubscription ){ this._invoicesHistorySubscription.unsubscribe(); }
    if( this._parameterSubscription ){ this._parameterSubscription.unsubscribe(); }
  }
}