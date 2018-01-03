import { Meteor } from 'meteor/meteor';
import { User } from '../../models/auth/user.model';
import { UserDetail, UserDetailPenalty } from '../../models/auth/user-detail.model';
import { UserDetails } from '../../collections/auth/user-detail.collection';
import { Account } from '../../models/restaurant/account.model';
import { Accounts } from '../../collections/restaurant/account.collection';
import { Order, OrderTranslateInfo } from '../../models/restaurant/order.model';
import { Orders } from '../../collections/restaurant/order.collection';
import { Payments } from '../../collections/restaurant/payment.collection';
import { WaiterCallDetails } from '../../collections/restaurant/waiter-call-detail.collection';
import { Table } from '../../models/restaurant/table.model';
import { Tables } from '../../collections/restaurant/table.collection';
import { UserPenalties } from '../../collections/auth/user-penalty.collection';
import { Parameters } from '../../collections/general/parameter.collection';
import { Parameter } from '../../models/general/parameter.model';

if( Meteor.isServer ){
    Meteor.methods({
        penalizeCustomer: function( _pCustomerUser : User ){
            let _lUserDetail: UserDetail = UserDetails.findOne( { user_id: _pCustomerUser._id } );
            let _lCustomerRestaurant: string = _lUserDetail.current_restaurant;
            let _lCustomerTable: string = _lUserDetail.current_table;
            let _lCustomerAccount: Account = Accounts.findOne( { restaurantId: _lCustomerRestaurant, tableId: _lCustomerTable, status: 'OPEN' } );

            if( _lCustomerAccount ){
                let _lUserOrders: string [] = [];
                Orders.find( { creation_user: _pCustomerUser._id, restaurantId: _lCustomerRestaurant, tableId: _lCustomerTable, accountId: _lCustomerAccount._id } ).fetch().forEach( ( order ) => {
                    _lUserOrders.push( order._id );
                });
                Orders.find( { creation_user: _pCustomerUser._id, restaurantId: _lCustomerRestaurant, tableId: _lCustomerTable, accountId: _lCustomerAccount._id,
                status: { $in: [ 'ORDER_STATUS.REGISTERED', 'ORDER_STATUS.PREPARED' ] } } ).fetch().forEach( ( order ) => {
                    Orders.update( { _id: order._id }, { $set: { status: 'ORDER_STATUS.CANCELED', modification_date : new Date(), canceled_by_penalization: true } } );
                });

                Orders.find( { creation_user: _pCustomerUser._id, restaurantId: _lCustomerRestaurant, tableId: _lCustomerTable, accountId: _lCustomerAccount._id,
                status: { $in: [ 'ORDER_STATUS.IN_PROCESS' ] } } ).fetch().forEach( ( order ) => {
                    Orders.update( { _id: order._id }, { $set: { status: 'ORDER_STATUS.CANCELED', modification_date : new Date(), canceled_by_penalization: false } } );
                });

                Orders.find( { creation_user: _pCustomerUser._id, restaurantId: _lCustomerRestaurant, tableId: _lCustomerTable, accountId: _lCustomerAccount._id,
                status: { $in: [ 'ORDER_STATUS.DELIVERED' ] } } ).fetch().forEach( ( order ) => {
                    Orders.update( { _id: order._id }, { $set: { status: 'ORDER_STATUS.CANCELED', modification_date : new Date(), canceled_by_penalization: true } } );
                    Accounts.update( { _id: _lCustomerAccount._id }, { $set: { total_payment: _lCustomerAccount.total_payment - order.totalPayment } } );
                });

                Orders.find( { restaurantId: _lCustomerRestaurant, tableId: _lCustomerTable, accountId: _lCustomerAccount._id, 'translateInfo.firstOrderOwner': _pCustomerUser._id, 
                'translateInfo.markedToTranslate': true, status: 'ORDER_STATUS.PENDING_CONFIRM', toPay : false } ).fetch().forEach( ( order ) => {
                    let _lOrderTranslate: OrderTranslateInfo = { firstOrderOwner: order.translateInfo.firstOrderOwner, markedToTranslate: false, 
                                                                 lastOrderOwner: '', confirmedToTranslate: false };
                    Orders.update( { _id: order._id }, { $set: { status: 'ORDER_STATUS.DELIVERED', modification_date : new Date(), translateInfo: _lOrderTranslate } } );
                });

                Orders.find( { restaurantId: _lCustomerRestaurant, tableId: _lCustomerTable, accountId: _lCustomerAccount._id, 'translateInfo.lastOrderOwner': _pCustomerUser._id, 
                'translateInfo.markedToTranslate': true, status: 'ORDER_STATUS.PENDING_CONFIRM', toPay : false } ).fetch().forEach( ( order ) => {
                    let _lOrderTranslate: OrderTranslateInfo = { firstOrderOwner: _pCustomerUser._id, markedToTranslate: false, 
                                                                 lastOrderOwner: '', confirmedToTranslate: false };
                    Orders.update( { _id: order._id }, { $set: { status: 'ORDER_STATUS.CANCELED', modification_date : new Date(), translateInfo: _lOrderTranslate, canceled_by_penalization: true } } );
                });

                WaiterCallDetails.find( { restaurant_id: _lCustomerRestaurant, table_id: _lCustomerTable, order_id: { $in: _lUserOrders }, type: 'SEND_ORDER',
                status: { $in: [ 'waiting', 'completed' ] } } ).fetch().forEach( ( call ) => {
                    WaiterCallDetails.update( { _id: call._id }, { $set: { status: 'cancel', modification_date : new Date() } } );
                });

                WaiterCallDetails.find( { restaurant_id: _lCustomerRestaurant, table_id: _lCustomerTable, user_id: _pCustomerUser._id, type: { $in : [ 'CALL_OF_CUSTOMER', 'USER_EXIT_TABLE', 'PAYMENT' ] },
                status: { $in: [ 'waiting', 'completed' ] } } ).fetch().forEach( ( call ) => {
                    WaiterCallDetails.update( { _id: call._id }, { $set: { status: 'cancel', modification_date : new Date() } } );
                });

                Payments.find( { creation_user: _pCustomerUser._id, restaurantId: _lCustomerRestaurant, accountId: _lCustomerAccount._id,
                tableId: _lCustomerTable, status: 'PAYMENT.NO_PAID', received: false } ).fetch().forEach( ( pay ) => {
                    Payments.update( { _id: pay._id }, { $set: { status: 'CANCELED', canceled_by_penalization: true } } );
                    Accounts.update( { _id: _lCustomerAccount._id }, { $set: { total_payment: _lCustomerAccount.total_payment - pay.totalOrdersPrice } } );
                });

                let _lTableAmountPeople: number = Tables.findOne( { _id: _lCustomerTable } ).amount_people;
                let _tablesUpdated: number = Tables.collection.update( { _id: _lCustomerTable }, { $set: { amount_people: _lTableAmountPeople - 1 } } );

                if( _tablesUpdated === 1 ){
                    let _lTableAux: Table = Tables.findOne( { _id: _lCustomerTable } );
                    if( _lTableAux.amount_people === 0 && _lTableAux.status === 'BUSY' ){
                        Tables.update( { _id: _lCustomerTable }, { $set: { status: 'FREE' } } );
                        Accounts.update( { _id: _lCustomerAccount._id }, { $set: { status: 'CLOSED' } } );
                    }
                }
                let _lUserDetailPenalty: UserDetailPenalty = { restaurant_id: _lCustomerRestaurant, date: new Date() };
                UserDetails.update( { _id: _lUserDetail._id }, { $push: { penalties: _lUserDetailPenalty } } );
                let _lUsersUpdated : number = UserDetails.collection.update( { _id: _lUserDetail._id }, { $set: { current_restaurant: '', current_table: '' } } );
                if( _lUsersUpdated === 1 ){
                    let _lUserDetailAux: UserDetail = UserDetails.findOne( { _id: _lUserDetail._id } );
                    let _lMaxUserPenalties: Parameter = Parameters.findOne( { name: 'max_user_penalties' } );
                    if( _lUserDetailAux.penalties.length >= Number( _lMaxUserPenalties.value ) ){
                        let _lLast_date: Date = new Date( Math.max.apply( null, _lUserDetailAux.penalties.map( function( p ){ return new Date( p.date ); } ) ) );
                        UserPenalties.insert({
                            user_id: _pCustomerUser._id,
                            is_active: true,
                            last_date: _lLast_date,
                            penalties: _lUserDetailAux.penalties
                        });
                        UserDetails.update( { _id: _lUserDetail._id }, { $set: { penalties: [] } } );
                    }
                }
            } else {
                throw new Meteor.Error( '200' );
            }
        }
    });
}