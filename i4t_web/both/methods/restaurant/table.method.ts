import { Meteor } from 'meteor/meteor';
import { Table } from '../../models/restaurant/table.model';
import { Tables } from '../../collections/restaurant/table.collection';
import { Orders } from '../../collections/restaurant/order.collection';
import { WaiterCallDetails } from '../../collections/restaurant/waiter-call-detail.collection';
import { Account } from '../../models/restaurant/account.model';
import { Accounts } from '../../collections/restaurant/account.collection';
import { UserDetails } from '../../collections/auth/user-detail.collection';

if (Meteor.isServer) {
    Meteor.methods({
        getCurrentTableByUser: function (_idTable) {
            let table = Tables.collection.findOne({ _id: _idTable });
            if (typeof table != "undefined" || table != null) {
                return table;
            } else {
                return null;
            }
        },

        getIdTableByQr: function (_qrCode) {
            let table = Tables.collection.findOne({ QR_code: _qrCode, is_active : true });
            if (typeof table != "undefined" || table != null) {
                return table;
            } else {
                return null;
            }
        },

        changeCurrentTable: function( _pUserId:string, _pRestaurantId:string, _pQRCodeCurrentTable:string, _pQRCodeDestinationTable:string ){
            if( _pQRCodeCurrentTable === _pQRCodeDestinationTable ){
                throw new Meteor.Error('207');
            }
            let _lCurrentTable: Table = Tables.findOne( { QR_code: _pQRCodeCurrentTable } );
            let _lAccountCurrentTable: Account = Accounts.findOne( { restaurantId: _pRestaurantId, tableId: _lCurrentTable._id, status: 'OPEN' } );
            let _lDestinationTable: Table = Tables.findOne( { QR_code: _pQRCodeDestinationTable } );
            if(  _lDestinationTable ){
                if( _lDestinationTable.is_active ){
                    if( _lDestinationTable.restaurantId === _pRestaurantId ){
                        let _lOrdersToConfirm: number = Orders.find( { restaurantId: _pRestaurantId, tableId: _lCurrentTable._id, 'translateInfo.firstOrderOwner': _pUserId, 
                                                                    'translateInfo.markedToTranslate': true, status: 'ORDER_STATUS.PENDING_CONFIRM', toPay : false } ).fetch().length;
                        let _lOrdersWithPendingConfirmation: number = Orders.find( { restaurantId: _pRestaurantId, tableId: _lCurrentTable._id, 'translateInfo.lastOrderOwner': _pUserId, 
                                                                                    'translateInfo.markedToTranslate': true, status: 'ORDER_STATUS.PENDING_CONFIRM', toPay : false } ).fetch().length;
                        if( _lOrdersToConfirm <= 0 && _lOrdersWithPendingConfirmation <= 0 ){
                            let _lOrdersMarkedToPay: number = Orders.find( { creation_user: _pUserId, restaurantId: _pRestaurantId, tableId: _lCurrentTable._id, 
                                                                            status: 'ORDER_STATUS.DELIVERED', toPay : true } ).fetch().length;
                            if( _lOrdersMarkedToPay <= 0 ){
                                let _lWaiterCalls: number = WaiterCallDetails.find( { restaurant_id: _pRestaurantId, table_id: _lCurrentTable._id, type: 'CALL_OF_CUSTOMER',
                                                                                    user_id: _pUserId, status: 'completed' } ).fetch().length;
                                if( _lWaiterCalls <= 0 ){
                                    let _ltotalPaymentOrdersDelivered: number = 0;
                                    Orders.find( { creation_user: _pUserId, restaurantId: _pRestaurantId, tableId: _lCurrentTable._id, 
                                                status: 'ORDER_STATUS.DELIVERED', toPay : false } ).fetch().forEach( ( order ) => {
                                                    _ltotalPaymentOrdersDelivered += order.totalPayment;
                                                });       

                                    Accounts.update( { _id: _lAccountCurrentTable._id }, 
                                                    { $set: { total_payment: _lAccountCurrentTable.total_payment - _ltotalPaymentOrdersDelivered } } );   
                                    let _lNewAmountPeople: number = _lCurrentTable.amount_people - 1;
                                    Tables.update( { _id: _lCurrentTable._id }, { $set: { amount_people: _lNewAmountPeople } } );

                                    Orders.find( { creation_user: _pUserId, restaurantId: _pRestaurantId, tableId: _lCurrentTable._id, accountId: _lAccountCurrentTable._id,
                                                status: 'ORDER_STATUS.PREPARED' } ).fetch().forEach( ( order ) => {
                                                        WaiterCallDetails.update( { restaurant_id: _pRestaurantId, table_id: _lCurrentTable._id, status: 'completed', order_id: order._id }, { $set: { table_id: _lDestinationTable._id } } );
                                    });        

                                    if( _lDestinationTable.status === 'BUSY' ){
                                        Tables.update( { _id: _lDestinationTable._id }, { $set: { amount_people: _lDestinationTable.amount_people + 1 } } );
                                        let _lAccountDestinationTable: Account = Accounts.findOne( { restaurantId: _pRestaurantId, tableId: _lDestinationTable._id, status: 'OPEN' } );
                                        Accounts.update( { _id: _lAccountDestinationTable._id }, 
                                                        { $set: { total_payment: _lAccountDestinationTable.total_payment + _ltotalPaymentOrdersDelivered } } );
                                        Orders.find( { creation_user: _pUserId, restaurantId: _pRestaurantId, tableId: _lCurrentTable._id,
                                                    status: { $in: [ 'ORDER_STATUS.REGISTERED', 'ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED', 'ORDER_STATUS.DELIVERED' ] }  } ).fetch().forEach( ( order ) => {
                                                            Orders.update( { _id: order._id }, { $set: { tableId: _lDestinationTable._id, accountId: _lAccountDestinationTable._id, modification_user: _pUserId, modification_date: new Date() } } );
                                        });
                                    } else if( _lDestinationTable.status === 'FREE' ) {
                                        Tables.update( { _id: _lDestinationTable._id }, { $set: { status: 'BUSY', amount_people: 1 } } );
                                        let _lNewAccount = Accounts.collection.insert({
                                                                creation_date: new Date(),
                                                                creation_user: _pUserId,
                                                                restaurantId: _pRestaurantId,
                                                                tableId: _lDestinationTable._id,
                                                                status: 'OPEN',
                                                                total_payment: _ltotalPaymentOrdersDelivered
                                                            });
                                        Orders.find( { creation_user: _pUserId, restaurantId: _pRestaurantId, tableId: _lCurrentTable._id,
                                                    status: { $in: [ 'ORDER_STATUS.REGISTERED', 'ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED', 'ORDER_STATUS.DELIVERED' ] }  } ).fetch().forEach( ( order ) => {
                                                            Orders.update( { _id: order._id }, { $set: { tableId: _lDestinationTable._id, accountId: _lNewAccount, modification_user: _pUserId, modification_date: new Date() } } );
                                        });
                                    } else {
                                        throw new Meteor.Error('206');
                                    }

                                    let _lCurTableAux: Table = Tables.findOne( { QR_code: _pQRCodeCurrentTable } );
                                    if( _lCurTableAux.amount_people === 0 && _lCurTableAux.status === 'BUSY' ){
                                        Tables.update( { _id: _lCurTableAux._id }, { $set: { status: 'FREE' } } );
                                        let _lAccountCurTable: Account = Accounts.findOne( { restaurantId: _pRestaurantId, tableId: _lCurTableAux._id, status: 'OPEN' } );
                                        Accounts.update( { _id: _lAccountCurTable._id }, { $set: { status: 'CLOSED' } } );
                                    }    

                                    UserDetails.update( { user_id: _pUserId },{ $set: { current_table: _lDestinationTable._id } } );
                                } else {
                                    throw new Meteor.Error('205');
                                }
                            } else {
                                throw new Meteor.Error('204');
                            }
                        } else {
                            throw new Meteor.Error('203');
                        }
                    } else {
                        throw new Meteor.Error('202');
                    }
                } else {
                    throw new Meteor.Error('201');
                }
            } else {
                throw new Meteor.Error('200');
            }
        }
    });
}