import { Meteor } from 'meteor/meteor';
import { Table } from '../../models/establishment/table.model';
import { Tables } from '../../collections/establishment/table.collection';
import { Orders } from '../../collections/establishment/order.collection';
import { WaiterCallDetails } from '../../collections/establishment/waiter-call-detail.collection';
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
            let table = Tables.collection.findOne({ QR_code: _qrCode, is_active: true });
            if (typeof table != "undefined" || table != null) {
                return table;
            } else {
                return null;
            }
        },

        changeCurrentTable: function (_pUserId: string, _pEstablishmentId: string, _pQRCodeCurrentTable: string, _pQRCodeDestinationTable: string) {
            if (_pQRCodeCurrentTable === _pQRCodeDestinationTable) {
                throw new Meteor.Error('207');
            }
            let _lCurrentTable: Table = Tables.findOne({ QR_code: _pQRCodeCurrentTable });
            let _lDestinationTable: Table = Tables.findOne({ QR_code: _pQRCodeDestinationTable });

            if (_lDestinationTable) {
                if (_lDestinationTable.is_active) {
                    if (_lDestinationTable.establishment_id === _pEstablishmentId) {

                        let _lWaiterCalls: number = WaiterCallDetails.find({
                            establishment_id: _pEstablishmentId, table_id: _lCurrentTable._id, type: 'CALL_OF_CUSTOMER',
                            user_id: _pUserId, status: 'completed'
                        }).fetch().length;
                        if (_lWaiterCalls <= 0) {
                            let _lNewAmountPeople: number = _lCurrentTable.amount_people - 1;
                            Tables.update({ _id: _lCurrentTable._id }, { $set: { amount_people: _lNewAmountPeople } });
                            Orders.find({
                                creation_user: _pUserId, establishment_id: _pEstablishmentId, tableId: _lCurrentTable._id,
                                status: 'ORDER_STATUS.CONFIRMED'
                            }).fetch().forEach((order) => {
                                WaiterCallDetails.update({ establishment_id: _pEstablishmentId, table_id: _lCurrentTable._id, status: 'completed', order_id: order._id }, { $set: { table_id: _lDestinationTable._id } });
                            });

                            if (_lDestinationTable.status === 'BUSY') {
                                Tables.update({ _id: _lDestinationTable._id }, { $set: { amount_people: _lDestinationTable.amount_people + 1 } });
                                Orders.find({
                                    creation_user: _pUserId, establishment_id: _pEstablishmentId, tableId: _lCurrentTable._id,
                                    status: { $in: ['ORDER_STATUS.SELECTING', 'ORDER_STATUS.CONFIRMED'] }
                                }).fetch().forEach((order) => {
                                    Orders.update({ _id: order._id }, { $set: { tableId: _lDestinationTable._id, modification_user: _pUserId, modification_date: new Date() } });
                                });
                            } else if (_lDestinationTable.status === 'FREE') {
                                Tables.update({ _id: _lDestinationTable._id }, { $set: { status: 'BUSY', amount_people: 1 } });
                                Orders.find({
                                    creation_user: _pUserId, establishment_id: _pEstablishmentId, tableId: _lCurrentTable._id,
                                    status: { $in: ['ORDER_STATUS.SELECTING', 'ORDER_STATUS.CONFIRMED'] }
                                }).fetch().forEach((order) => {
                                    Orders.update({ _id: order._id }, { $set: { tableId: _lDestinationTable._id, modification_user: _pUserId, modification_date: new Date() } });
                                });
                            } else {
                                throw new Meteor.Error('206');
                            }

                            let _lCurTableAux: Table = Tables.findOne({ QR_code: _pQRCodeCurrentTable });
                            if (_lCurTableAux.amount_people === 0 && _lCurTableAux.status === 'BUSY') {
                                Tables.update({ _id: _lCurTableAux._id }, { $set: { status: 'FREE' } });
                            }

                            UserDetails.update({ user_id: _pUserId }, { $set: { current_table: _lDestinationTable._id } });
                        } else {
                            throw new Meteor.Error('205');
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