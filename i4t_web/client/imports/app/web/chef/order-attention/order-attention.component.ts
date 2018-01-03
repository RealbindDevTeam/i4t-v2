import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MatDialogRef, MatDialog, MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../services/general/user-language.service';
import { Order, OrderItem } from '../../../../../../both/models/restaurant/order.model';
import { Orders } from '../../../../../../both/collections/restaurant/order.collection';
import { Item } from '../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../both/collections/menu/item.collection';
import { Table } from '../../../../../../both/models/restaurant/table.model';
import { Tables } from '../../../../../../both/collections/restaurant/table.collection';
import { GarnishFood } from '../../../../../../both/models/menu/garnish-food.model';
import { GarnishFoodCol } from '../../../../../../both/collections/menu/garnish-food.collection';
import { Addition } from '../../../../../../both/models/menu/addition.model';
import { Additions } from '../../../../../../both/collections/menu/addition.collection';
import { Restaurant } from '../../../../../../both/models/restaurant/restaurant.model';
import { Restaurants } from "../../../../../../both/collections/restaurant/restaurant.collection";
import { UserDetail } from '../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { AlertConfirmComponent } from '../../../web/general/alert-confirm/alert-confirm.component';

@Component({
    selector: 'order-attention',
    templateUrl: './order-attention.component.html',
    styleUrls: [ './order-attention.component.scss' ]
})
export class OrderAttentionComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _ordersSub                      : Subscription;
    private _itemsSub                       : Subscription;
    private _tablesSub                      : Subscription;
    private _garnishFoodSub                 : Subscription;
    private _additionsSub                   : Subscription;
    private _userDetailSub                  : Subscription;
    private _userRestaurantSub              : Subscription;

    private _ordersInProcess                : Observable<Order[]>;    
    private _ordersCanceled                 : Observable<Order[]>;
    private _ordersCanceledByAdmin          : Observable<Order[]>;
    private _ordersInProcessDetail          : Observable<Order[]>;
    private _ordersCanceledDetail           : Observable<Order[]>;
    private _ordersCanceledByAdminDetail    : Observable<Order[]>;
    private _items                          : Observable<Item[]>;
    private _tables                         : Observable<Table[]>;
    private _garnishFoodCol                 : Observable<GarnishFood[]>;
    private _additions                      : Observable<Addition[]>;
    private _restaurants                    : Observable<Restaurant[]>;

    private _showDetails                    : boolean = false;
    private _loading                        : boolean;
    private titleMsg                        : string;
    private btnAcceptLbl                    : string;
    public _dialogRef                       : MatDialogRef<any>;
    private _thereAreOrders                 : boolean = true;
    private _userDetail                     : UserDetail;

    private _ordersInProcessIndex           : number = -1;
    private _ordersCanceledIndex            : number = -1;
    private _ordersCanceledByAdminIndex     : number = -1;

    /**
     * OrderAttentionComponent Constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone
     * @param {UserLanguageService} _userLanguageService
     */
    constructor( private _translate: TranslateService, 
                 private _ngZone: NgZone,
                 private _userLanguageService: UserLanguageService,
                 protected _mdDialog: MatDialog,
                 public snackBar: MatSnackBar ) {
                    _translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
                    _translate.setDefaultLang( 'en' );
                    this.titleMsg = 'SIGNUP.SYSTEM_MSG';
                    this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit(){
        this.removeSubscriptions();

        this._userDetailSub = MeteorObservable.subscribe( 'getUserDetailsByUser', Meteor.userId() ).subscribe(()=>{
            this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
            if (this._userDetail){
                this._userRestaurantSub = MeteorObservable.subscribe( 'getRestaurantById', this._userDetail.restaurant_work ).subscribe(() => {
                    this._restaurants = Restaurants.find({_id : this._userDetail.restaurant_work});
                });
            }
        });

        this._ordersSub = MeteorObservable.subscribe( 'getOrdersByRestaurantWork', this._user, [ 'ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.CANCELED' ] ).subscribe( () => {
            this._ngZone.run( () => {
                this._ordersInProcess = Orders.find( { status: 'ORDER_STATUS.IN_PROCESS' } ).zone();
                this._ordersCanceled = Orders.find( { status: 'ORDER_STATUS.CANCELED', markedToCancel: true } ).zone();
                this._ordersCanceledByAdmin = Orders.find( { status: 'ORDER_STATUS.CANCELED', canceled_by_penalization: false } ).zone();
                this.countOrders();
                this._ordersInProcess.subscribe( () => { this.countOrders(); } );
                this._ordersCanceled.subscribe( () => { this.countOrders(); } );
                this._ordersCanceledByAdmin.subscribe( () => { this.countOrders(); } );
            });
        });
        this._itemsSub = MeteorObservable.subscribe( 'getItemsByRestaurantWork', this._user ).subscribe( () => {
            this._ngZone.run( () => {
                this._items = Items.find( { } ).zone();
            });
        });
        this._tablesSub = MeteorObservable.subscribe( 'getTablesByRestaurantWork', this._user ).subscribe( () => {
            this._ngZone.run( () => {
                this._tables = Tables.find( { } ).zone();
            });
        });
        this._garnishFoodSub = MeteorObservable.subscribe( 'garnishFoodByRestaurantWork', this._user ).subscribe( () => {
            this._ngZone.run( () => {
                this._garnishFoodCol = GarnishFoodCol.find( { } ).zone();
            });
        });
        this._additionsSub = MeteorObservable.subscribe( 'additionsByRestaurantWork', this._user ).subscribe( () => {
            this._ngZone.run( () => {
                this._additions = Additions.find( { } ).zone();
            });
        });
    }

    /**
     * Validate if restaurants exist
     */
    countOrders():void{
        let _lOrdersInProcess: number = Orders.collection.find( { status: 'ORDER_STATUS.IN_PROCESS' } ).count();
        let _lOrdersCanceled: number = Orders.collection.find( { status: 'ORDER_STATUS.CANCELED', markedToCancel: true } ).count();
        let _lOrdersCanceledByAdmin: number = Orders.collection.find( { status: 'ORDER_STATUS.CANCELED', canceled_by_penalization: false } ).count();
        ( _lOrdersInProcess > 0 || _lOrdersCanceled > 0 || _lOrdersCanceledByAdmin > 0 ) ? this._thereAreOrders = true : this._thereAreOrders = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions():void{
        if( this._ordersSub ){ this._ordersSub.unsubscribe(); }
        if( this._itemsSub ){ this._itemsSub.unsubscribe(); }
        if( this._tablesSub ){ this._tablesSub.unsubscribe(); }
        if( this._garnishFoodSub ){ this._garnishFoodSub.unsubscribe(); }
        if( this._additionsSub ){ this._additionsSub.unsubscribe(); }
        if( this._userDetailSub ){ this._userDetailSub.unsubscribe(); }
        if( this._userRestaurantSub ){ this._userRestaurantSub.unsubscribe(); }
    }

    /**
     * Show Order in process detail
     * @param {Order} _pOrder 
     * @param {number} _pIndex 
     */
    showOrderInProcessDetail( _pOrder: Order, _pIndex: number ):void{
        if( this._ordersInProcessIndex === _pIndex ) {
            this._ordersInProcessIndex = -1;
        } else {
            this._ordersInProcessIndex = _pIndex;
        }
        this._ordersCanceledIndex = -1;
        this._ordersCanceledByAdminIndex = -1;
        this._ordersInProcessDetail = Orders.find( { _id: _pOrder._id } ).zone();
    }

    /**
     * Show order canceled detail
     * @param {Order} _pOrder 
     * @param {number} _pIndex 
     */
    showOrderCanceledDetail( _pOrder: Order, _pIndex: number ):void{
        if( this._ordersCanceledIndex === _pIndex ){
            this._ordersCanceledIndex = -1;
        } else {
            this._ordersCanceledIndex = _pIndex;
        }
        this._ordersInProcessIndex = -1;
        this._ordersCanceledByAdminIndex = -1;
        this._ordersCanceledDetail = Orders.find( { _id: _pOrder._id } ).zone();
    }

    /**
     * Show order canceled by admin detail
     * @param {Order} _pOrder 
     * @param {number} _pIndex 
     */
    showOrdersCanceledByAdminDetail( _pOrder: Order, _pIndex: number ):void{
        if( this._ordersCanceledByAdminIndex === _pIndex ){
            this._ordersCanceledByAdminIndex = -1;
        } else {
            this._ordersCanceledByAdminIndex = _pIndex;
        }
        this._ordersInProcessIndex = -1;
        this._ordersCanceledIndex = -1;
        this._ordersCanceledByAdminDetail = Orders.find( { _id: _pOrder._id } ).zone();
    }

    /**
     * Set status order to PREPARED
     * @param {Order} _pOrder 
     */
    setPreparedState( _pOrder: Order ):void{
        if( !Meteor.userId() ){
            var error : string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        var data : any = {
          restaurants : _pOrder.restaurantId,
          tables : _pOrder.tableId,
          user : this._user,
          waiter_id : "",
          status : "waiting",
          type : "SEND_ORDER",
          order_id : _pOrder._id
        }
        
        this._loading = true;
        setTimeout(() => {
          MeteorObservable.call('findQueueByRestaurant', data).subscribe(() => {
            Orders.update({ _id: _pOrder._id }, { $set: { status: 'ORDER_STATUS.PREPARED', modification_user: this._user, modification_date: new Date() } });
            this._loading = false;
            let _lMessage: string = this.itemNameTraduction( 'ORDER_ATTENTION.ORDER_PREPARED_MSG' );
            this.snackBar.open( _lMessage, '', { duration: 2500 } );
          }, (error) => {
            this.openDialog(this.titleMsg, '', error.reason, '', this.btnAcceptLbl, false);
          });
        }, 1500);
    }

    /**
     * Return traduction
     * @param {string} itemName 
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * Function to validate if user order was processed to canceled
     * @param {Order}_pOrder
     */
    orderMarkedToCancel( _pOrder:Order ):boolean{
        if( _pOrder.markedToCancel !== undefined && _pOrder.markedToCancel !== null ){
            if( _pOrder.markedToCancel === true && _pOrder.status === 'ORDER_STATUS.CANCELED' ){
                return true;
            } else {
                return false;
            }
        } else if( _pOrder.canceled_by_penalization !== undefined && _pOrder.canceled_by_penalization !== null ){
            if( _pOrder.canceled_by_penalization === false && _pOrder.status === 'ORDER_STATUS.CANCELED' ){
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Function to delete order from the chef screen
     * @param {Order} _pOrder 
     */
    deleteOrder( _pOrder:Order ):void{
        if( !Meteor.userId() ){
            var error : string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        this._loading = true;
        setTimeout(() => {
            if( _pOrder.markedToCancel !== undefined && _pOrder.markedToCancel !== null ){
                if( _pOrder.markedToCancel === true && _pOrder.status === 'ORDER_STATUS.CANCELED' ){
                    Orders.update( { _id: _pOrder._id }, 
                        { $set: { markedToCancel: false,
                            modification_user: this._user, 
                            modification_date: new Date() 
                        } 
                    });
                }
            } else if( _pOrder.canceled_by_penalization !== undefined && _pOrder.canceled_by_penalization !== null ){
                if( _pOrder.canceled_by_penalization === false && _pOrder.status === 'ORDER_STATUS.CANCELED' ){
                    Orders.update( { _id: _pOrder._id }, 
                        { $set: { canceled_by_penalization: true,
                            modification_user: this._user, 
                            modification_date: new Date() 
                        } 
                    });
                }
            }
            this._loading = false;
            let _lMessage: string = this.itemNameTraduction( 'ORDER_ATTENTION.ORDER_DELETED' );
            this.snackBar.open( _lMessage, '', { duration: 2500 } );
        }, 1500);
    }

    /**
    * This function open de error dialog according to parameters 
    * @param {string} title
    * @param {string} subtitle
    * @param {string} content
    * @param {string} btnCancelLbl
    * @param {string} btnAcceptLbl
    * @param {boolean} showBtnCancel
    */
    openDialog(title: string, subtitle: string, content: string, btnCancelLbl: string, btnAcceptLbl: string, showBtnCancel: boolean) {
        
        this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: title,
                subtitle: subtitle,
                content: content,
                buttonCancel: btnCancelLbl,
                buttonAccept: btnAcceptLbl,
                showBtnCancel: showBtnCancel
            }
        });
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = result;
            if (result.success) {

            }
        });
    }
    
    /**
     * ngOnDestory Implementation
     */
    ngOnDestroy(){
        this.removeSubscriptions();    
    }
}