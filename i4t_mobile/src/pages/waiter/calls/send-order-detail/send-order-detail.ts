import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingController, NavController, NavParams, ToastController } from 'ionic-angular';
import { MeteorObservable } from "meteor-rxjs";
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from "rxjs";
import { Additions } from 'i4t_web/both/collections/menu/addition.collection';
import { Orders } from 'i4t_web/both/collections/restaurant/order.collection';
import { Table } from 'i4t_web/both/models/restaurant/table.model';
import { Tables } from 'i4t_web/both/collections/restaurant/table.collection';
import { WaiterCallDetail } from 'i4t_web/both/models/restaurant/waiter-call-detail.model';
import { Users } from 'i4t_web/both/collections/auth/user.collection';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';

@Component({
  selector : 'send-order-detail-page',
  templateUrl: 'send-order-detail.html'
})
export class SendOrderDetailsPage implements OnInit, OnDestroy {
    
    private _orderSubscription          : Subscription;
    private _usersSubscription          : Subscription;
    private _tablesSubscription         : Subscription;
    private _additionsSubscription      : Subscription;
    private _call                    : WaiterCallDetail;
    
    private _tableNumber       : string;
    private _tableQRCode       : string;
    private _orders            : any;

    /**
     * SendOrderDetailsPage constructor
     * @param _params 
     */
    constructor( public _loadingCtrl : LoadingController,
                 public _navCtrl     : NavController,
                 public _params      : NavParams,
                 public _translate   : TranslateService,
                 private _toastCtrl  : ToastController,
                 private _userLanguageService: UserLanguageServiceProvider ){
        _translate.setDefaultLang('en');
        this._call = this._params.get('call');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit(){
        this._translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
        this.removeSubscriptions();
        this._orderSubscription = MeteorObservable.subscribe( 'getOrderById', this._call.order_id ).subscribe( () => {
            this._orders = Orders.find({});
        });
        this._usersSubscription = MeteorObservable.subscribe('getUserByTableId', this._call.restaurant_id, this._call.table_id ).subscribe();
        this._tablesSubscription = MeteorObservable.subscribe( 'getTablesByRestaurant', this._call.restaurant_id ).subscribe( () => {
            let _lTable : Table = Tables.collection.find( { _id : this._call.table_id } ).fetch()[0];
            this._tableNumber = _lTable._number + '';
            this._tableQRCode = _lTable.QR_code;
        });
        this._additionsSubscription = MeteorObservable.subscribe('additionsByRestaurant', this._call.restaurant_id).subscribe();
    }

    /**
     * Return User Name
     * @param {string} _pUserId 
     */
    getUserName( _pUserId:string ):string{
        let _user = Users.collection.find( { } ).fetch().filter( u => u._id === _pUserId )[0];
        if( _user ){
            if( _user.username ){
                return _user.username;
            }
            else if( _user.profile.name ){
                return _user.profile.name;
            }
        }
    }

    /**
     * Get Addition name
     * @param _pAdditionId 
     */
    getNameAddition( _pAdditionId: string) : string{
        let _lAddition = Additions.collection.findOne( { _id: _pAdditionId } );
        if( _lAddition ){
            return _lAddition.name;
        } else {
            return;
        }
    }

    /**
    * Function that allows remove a job of the Waiter Calls queue
    */
    closeWaiterCall(  ){
        let loading_msg = this.itemNameTraduction('MOBILE.WAITER_CALL.LOADING'); 
    
        let loading = this._loadingCtrl.create({
            content: loading_msg
        });
        loading.present();
        setTimeout(() => {
            MeteorObservable.call('closeCall', this._call, Meteor.userId()).subscribe(() => {
                loading.dismiss();
                this.presentToast();
                this._navCtrl.pop();
            });
        }, 1500);
    }

    /**
    * Function that allow show a toast confirmation
    */
    presentToast() {
        let msg = this.itemNameTraduction('MOBILE.WAITER_CALL.MSG_COMFIRM'); 
        let toast = this._toastCtrl.create({
            message: msg,
            duration: 1500,
            position: 'middle'
        });
        toast.onDidDismiss(() => {
        });
        toast.present();
    }

  /**
   * This function allow translate strings
   * @param {string} _itemName 
   */
  itemNameTraduction(_itemName: string): string {
    var wordTraduced: string;
    this._translate.get(_itemName).subscribe((res: string) => {
        wordTraduced = res;
    });
    return wordTraduced;
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
        if( this._orderSubscription ){ this._orderSubscription.unsubscribe(); }
        if( this._usersSubscription ){ this._usersSubscription.unsubscribe(); }
        if( this._tablesSubscription ){ this._tablesSubscription.unsubscribe(); }
        if( this._additionsSubscription ){ this._additionsSubscription.unsubscribe(); }
    }
}