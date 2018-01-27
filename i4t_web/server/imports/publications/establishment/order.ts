import { Meteor } from 'meteor/meteor';
import { Orders } from '../../../../both/collections/establishment/order.collection';
import { check } from 'meteor/check';
import { Table } from '../../../../both/models/establishment/table.model';
import { Tables } from '../../../../both/collections/establishment/table.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { Establishments } from '../../../../both/collections/establishment/establishment.collection';
import { Establishment } from '../../../../both/models/establishment/establishment.model';

/**
 * Meteor publication orders with establishmentId and status conditions
 * @param {string} _establishmentId
 * @param {string} _status
 */
Meteor.publish('getOrders', function (_establishmentId: string, _tableQRCode: string, _status: string[]) {
    check(_establishmentId, String);
    check(_tableQRCode, String);

    let _lTable: Table = Tables.findOne({ QR_code: _tableQRCode });
    if (_lTable) {
        return Orders.find({ establishment_id: _establishmentId, tableId: _lTable._id, status: { $in: _status } });
    } else {
        return;
    }
});

/**
 * Meteor publications orders with establishmentId and status conditions
 * @param {string}
 * @param {string}
*/
Meteor.publish('getOrdersByTableId', function (_establishmentId: string, _tableId, _status: string[]) {
    check(_establishmentId, String);
    return Orders.find({ establishment_id: _establishmentId, tableId: _tableId, status: { $in: _status } });
});

/**
 * Meteor publications orders with userId and status conditions
 * @param {string}
 * @param {string}
*/
Meteor.publish('getOrdersByUserId', function (_userId: string, _status: string[]) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if (_lUserDetail) {
        if (_lUserDetail.current_establishment !== '' && _lUserDetail.current_table !== '') {
            return Orders.find({ establishment_id: _lUserDetail.current_establishment, tableId: _lUserDetail.current_table, status: { $in: _status } });
        } else {
            return;
        }
    } else {
        return;
    }
});

/**
 * Meteor publication orders with establishmentId condition
 * @param {string} _establishmentId
*/
Meteor.publish('getOrdersByEstablishmentId', function (_establishmentId: string, _status: string[]) {
    check(_establishmentId, String);
    return Orders.find({ establishment_id: _establishmentId, status: { $in: _status } });
});

/**
 * Meteor publication orders by establishment work
 * @param {string} _userId
 * @param {sring[]} _status
 */
Meteor.publish('getOrdersByEstablishmentWork', function (_userId: string, _status: string[]) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if (_lUserDetail) {
        return Orders.find({ establishment_id: _lUserDetail.establishment_work, status: { $in: _status } });
    } else {
        return;
    }
});

/**
 * Meteor publications return orders by id
 */
Meteor.publish('getOrderById', function (_orderId: string) {
    return Orders.find({ _id: _orderId });
});

/**
 * Meteor publications orders with establishment Ids and status conditions
 * @param {string[]} _pEstablishmentIds
 * @param {string[]} _status
*/
Meteor.publish('getOrdersByEstablishmentIds', function (_pEstablishmentIds: string[], _status: string[]) {
    return Orders.find({ establishment_id: { $in: _pEstablishmentIds }, status: { $in: _status } });
});

/**
 * Meteor publication return orders by user admin establishments
 * @param {string} _userId
 */
Meteor.publish('getOrdersByAdminUser', function (_userId: string, _status: string[]) {
    check(_userId, String);
    let _lEstablishmentId: string[] = [];
    Establishments.collection.find({ creation_user: _userId }).fetch().forEach(function <Establishment>(establishment, index, arr) {
        _lEstablishmentId.push(establishment._id);
    });
    return Orders.find({ establishment_id: { $in: _lEstablishmentId }, status: { $in: _status } });
});