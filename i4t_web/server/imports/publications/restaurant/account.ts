import { Meteor } from 'meteor/meteor';
import { Accounts } from '../../../../both/collections/restaurant/account.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { Restaurants } from '../../../../both/collections/restaurant/restaurant.collection';
import { Restaurant } from '../../../../both/models/restaurant/restaurant.model';
import { check } from 'meteor/check';

/**
 * Meteor publication accounts with restaurantId condition and tableId condition
 * @param {string} _restaurantId
 * @param {string} _status
 */
Meteor.publish('getAccountsByTableRestaurant', function (_restaurantId: string, _status: string) {
    check(_restaurantId, String);
    check(_status, String);
    return Accounts.find({ restaurantId: _restaurantId, status: _status });
});

/**
 * Meteor publication account by tableId
 * @param {string} _tableId
 */
Meteor.publish('getAccountsByTableId', function (_tableId: string) {
    check(_tableId, String);
    return Accounts.find({ tableId: _tableId });
});

/**
 * Meteor publication account by userId
 * @param {string} userId
 */
Meteor.publish('getAccountsByUserId', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if (_lUserDetail) {
        if (_lUserDetail.current_restaurant !== "" && _lUserDetail.current_table !== "") {
            return Accounts.find({ restaurantId: _lUserDetail.current_restaurant, tableId: _lUserDetail.current_table, status: 'OPEN' });
        } else {
            return;
        }
    } else {
        return;
    }

});

/**
 * Meteor publication return accounts by admin user restaurants
 * @param {string} _userId
 */
Meteor.publish('getAccountsByAdminUser', function (_userId: string) {
    check(_userId, String);
    let _lRestaurantsId: string[] = [];
    Restaurants.collection.find({ creation_user: _userId }).fetch().forEach(function <Restaurant>(restaurant, index, arr) {
        _lRestaurantsId.push(restaurant._id);
    });
    return Accounts.find({ restaurantId: { $in: _lRestaurantsId }, status: 'OPEN' });
});

/**
 * Meteor publication return accounts by restaurant work
 * @param {string} _userId
 */
Meteor.publish('getAccountsByRestaurantWork', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if (_lUserDetail) {
        return Accounts.find({ restaurantId: _lUserDetail.restaurant_work, status: 'OPEN' });
    } else {
        return;
    }
});