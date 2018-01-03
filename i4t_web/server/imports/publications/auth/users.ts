import { Meteor } from 'meteor/meteor';
import { Users } from '../../../../both/collections/auth/user.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { Restaurants } from '../../../../both/collections/restaurant/restaurant.collection';
import { Restaurant } from '../../../../both/models/restaurant/restaurant.model';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { check } from 'meteor/check';

/*Meteor.publish('getUserProfile', function () {
    return Users.find({_id: this.userId});
});*/

Meteor.publish('getUserSettings', function () {
    return Users.find({ _id: this.userId }, { fields: { username: 1, "services.profile.name": 1, "services.facebook": 1, "services.twitter": 1, "services.google": 1 } });
});

/**
 * Meteor publish, get all users
 */
Meteor.publish('getUsers', function () {
    return Users.find({});
});

/**
 * Meteor publish. Get user by Id
 */
Meteor.publish('getUserByUserId', function (_usrId: string) {
    return Users.find({ _id: _usrId });
});

/**
 * Meteor publication return users with restaurant and table Id conditions
 * @param {string} _pRestaurantId
 * @param {string} _pTableId
 */
Meteor.publish('getUserByTableId', function (_pRestaurantId: string, _pTableId) {
    check(_pRestaurantId, String);
    check(_pTableId, String);
    let _lUsers: string[] = [];
    UserDetails.collection.find({ current_restaurant: _pRestaurantId, current_table: _pTableId }).fetch().forEach(function <UserDetail>(user, index, arr) {
        _lUsers.push(user.user_id);
    });
    return Users.find({ _id: { $in: _lUsers } });
});

/**
 * Meteor publication return users by admin user Id
 */
Meteor.publish('getUsersByAdminUser', function (_pUserId: string) {
    check(_pUserId, String);
    let _lRestaurantsId: string[] = [];
    let _lUsers: string[] = [];
    Restaurants.collection.find({ creation_user: _pUserId }).fetch().forEach(function <Restaurant>(restaurant, index, arr) {
        _lRestaurantsId.push(restaurant._id);
    });
    UserDetails.collection.find({ current_restaurant: { $in: _lRestaurantsId } }).fetch().forEach(function <UserDetail>(userDetail, index, arr) {
        _lUsers.push(userDetail.user_id);
    });
    return Users.find({ _id: { $in: _lUsers } });
});
