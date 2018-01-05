import { Meteor } from 'meteor/meteor';
import { Orders } from '../../../../both/collections/establishment/order.collection';
import { check } from 'meteor/check';
import { Table } from '../../../../both/models/establishment/table.model';
import { Tables } from '../../../../both/collections/establishment/table.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { Account } from '../../../../both/models/establishment/account.model';
import { Accounts } from '../../../../both/collections/establishment/account.collection';
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
    let _lAccount: Account = Accounts.findOne({ establishment_id: _establishmentId, tableId: _lTable._id, status: 'OPEN' });
    if (_lTable && _lAccount) {
        return Orders.find({ accountId: _lAccount._id, establishment_id: _establishmentId, tableId: _lTable._id, status: { $in: _status } });
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
    let _lAccount: Account = Accounts.findOne({ establishment_id: _establishmentId, tableId: _tableId, status: 'OPEN' });
    if (_lAccount) {
        return Orders.find({ accountId: _lAccount._id, establishment_id: _establishmentId, tableId: _tableId, status: { $in: _status } });
    } else {
        return;
    }
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
            let _lAccount: Account = Accounts.findOne({
                establishment_id: _lUserDetail.current_establishment,
                tableId: _lUserDetail.current_table,
                status: 'OPEN'
            });
            if (_lAccount) {
                return Orders.find({ accountId: _lAccount._id, establishment_id: _lAccount.establishment_id, tableId: _lAccount.tableId, status: { $in: _status } });
            } else {
                return;
            }
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
 * Meteor publication orders by account
 * @param {string} _userId
 */
Meteor.publish('getOrdersByAccount', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if (_lUserDetail) {
        if (_lUserDetail.current_establishment !== "" && _lUserDetail.current_table !== "") {
            let _lAccount: Account = Accounts.findOne({
                establishment_id: _lUserDetail.current_establishment,
                tableId: _lUserDetail.current_table,
                status: 'OPEN'
            });
            if (_lAccount) {
                return Orders.find({ creation_user: _userId, establishment_id: _lAccount.establishment_id, tableId: _lAccount.tableId, status: 'ORDER_STATUS.DELIVERED' });
            } else {
                return;
            }
        } else {
            return;
        }
    } else {
        return;
    }
});

/**
 * Meteor publication return orders with translate confirmation pending
 */
Meteor.publish('getOrdersWithConfirmationPending', function (_establishmentId: string, _tableId: string) {
    check(_establishmentId, String);
    check(_tableId, String);
    let _lAccount: Account = Accounts.findOne({ establishment_id: _establishmentId, tableId: _tableId, status: 'OPEN' });
    if (_lAccount) {
        return Orders.find({
            accountId: _lAccount._id,
            establishment_id: _establishmentId,
            tableId: _tableId,
            status: 'ORDER_STATUS.PENDING_CONFIRM',
            'translateInfo.markedToTranslate': true,
            'translateInfo.confirmedToTranslate': false
        });
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
    let _lAccountsId: string[] = [];
    Establishments.collection.find({ creation_user: _userId }).fetch().forEach(function <Establishment>(establishment, index, arr) {
        _lEstablishmentId.push(establishment._id);
    });
    Accounts.collection.find({ establishment_id: { $in: _lEstablishmentId }, status: 'OPEN' }).fetch().forEach(function <Account>(account, index, arr) {
        _lAccountsId.push(account._id);
    });
    return Orders.find({ accountId: { $in: _lAccountsId }, status: { $in: _status } });
});