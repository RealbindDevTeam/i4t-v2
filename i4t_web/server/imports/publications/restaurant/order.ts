import { Meteor } from 'meteor/meteor';
import { Orders } from '../../../../both/collections/restaurant/order.collection';
import { check } from 'meteor/check';
import { Table } from '../../../../both/models/restaurant/table.model';
import { Tables } from '../../../../both/collections/restaurant/table.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { Account } from '../../../../both/models/restaurant/account.model';
import { Accounts } from '../../../../both/collections/restaurant/account.collection';
import { Restaurants } from '../../../../both/collections/restaurant/restaurant.collection';
import { Restaurant } from '../../../../both/models/restaurant/restaurant.model';

/**
 * Meteor publication orders with restaurantId and status conditions
 * @param {string} _restaurantId
 * @param {string} _status
 */
Meteor.publish('getOrders', function (_restaurantId: string, _tableQRCode: string, _status: string[]) {
    check(_restaurantId, String);
    check(_tableQRCode, String);

    let _lTable: Table = Tables.findOne({ QR_code: _tableQRCode });
    let _lAccount: Account = Accounts.findOne({ restaurantId: _restaurantId, tableId: _lTable._id, status: 'OPEN' });
    if (_lTable && _lAccount) {
        return Orders.find({ accountId: _lAccount._id, restaurantId: _restaurantId, tableId: _lTable._id, status: { $in: _status } });
    } else {
        return;
    }
});

/**
 * Meteor publications orders with restaurantId and status conditions
 * @param {string}
 * @param {string}
*/
Meteor.publish('getOrdersByTableId', function (_restaurantId: string, _tableId, _status: string[]) {
    check(_restaurantId, String);
    let _lAccount: Account = Accounts.findOne({ restaurantId: _restaurantId, tableId: _tableId, status: 'OPEN' });
    if (_lAccount) {
        return Orders.find({ accountId: _lAccount._id, restaurantId: _restaurantId, tableId: _tableId, status: { $in: _status } });
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
        if (_lUserDetail.current_restaurant !== '' && _lUserDetail.current_table !== '') {
            let _lAccount: Account = Accounts.findOne({
                restaurantId: _lUserDetail.current_restaurant,
                tableId: _lUserDetail.current_table,
                status: 'OPEN'
            });
            if (_lAccount) {
                return Orders.find({ accountId: _lAccount._id, restaurantId: _lAccount.restaurantId, tableId: _lAccount.tableId, status: { $in: _status } });
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
 * Meteor publication orders with restaurantId condition
 * @param {string} _restaurantId
*/
Meteor.publish('getOrdersByRestaurantId', function (_restaurantId: string, _status: string[]) {
    check(_restaurantId, String);
    return Orders.find({ restaurantId: _restaurantId, status: { $in: _status } });
});

/**
 * Meteor publication orders by restaurant work
 * @param {string} _userId
 * @param {sring[]} _status
 */
Meteor.publish('getOrdersByRestaurantWork', function (_userId: string, _status: string[]) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if (_lUserDetail) {
        return Orders.find({ restaurantId: _lUserDetail.restaurant_work, status: { $in: _status } });
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
        if (_lUserDetail.current_restaurant !== "" && _lUserDetail.current_table !== "") {
            let _lAccount: Account = Accounts.findOne({
                restaurantId: _lUserDetail.current_restaurant,
                tableId: _lUserDetail.current_table,
                status: 'OPEN'
            });
            if (_lAccount) {
                return Orders.find({ creation_user: _userId, restaurantId: _lAccount.restaurantId, tableId: _lAccount.tableId, status: 'ORDER_STATUS.DELIVERED' });
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
Meteor.publish('getOrdersWithConfirmationPending', function (_restaurantId: string, _tableId: string) {
    check(_restaurantId, String);
    check(_tableId, String);
    let _lAccount: Account = Accounts.findOne({ restaurantId: _restaurantId, tableId: _tableId, status: 'OPEN' });
    if (_lAccount) {
        return Orders.find({
            accountId: _lAccount._id,
            restaurantId: _restaurantId,
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
 * Meteor publications orders with restaurant Ids and status conditions
 * @param {string[]} _pRestaurantIds
 * @param {string[]} _status
*/
Meteor.publish('getOrdersByRestaurantIds', function (_pRestaurantIds: string[], _status: string[]) {
    return Orders.find({ restaurantId: { $in: _pRestaurantIds }, status: { $in: _status } });
});

/**
 * Meteor publication return orders by user admin restaurants
 * @param {string} _userId
 */
Meteor.publish('getOrdersByAdminUser', function (_userId: string, _status: string[]) {
    check(_userId, String);
    let _lRestaurantsId: string[] = [];
    let _lAccountsId: string[] = [];
    Restaurants.collection.find({ creation_user: _userId }).fetch().forEach(function <Restaurant>(restaurant, index, arr) {
        _lRestaurantsId.push(restaurant._id);
    });
    Accounts.collection.find({ restaurantId: { $in: _lRestaurantsId }, status: 'OPEN' }).fetch().forEach(function <Account>(account, index, arr) {
        _lAccountsId.push(account._id);
    });
    return Orders.find({ accountId: { $in: _lAccountsId }, status: { $in: _status } });
});