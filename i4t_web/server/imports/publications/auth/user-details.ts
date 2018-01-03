import { Meteor } from 'meteor/meteor';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { Restaurants } from '../../../../both/collections/restaurant/restaurant.collection';

Meteor.publish('getUsersDetails', function () {
    return UserDetails.find({});
});

Meteor.publish('getUserDetailsByUser', function (_userId: string) {
    check(_userId, String);
    return UserDetails.find({ user_id: _userId });
});

Meteor.publish('getUserDetailsByCurrentTable', function (_restaurantId: string, _tableId: string) {
    return UserDetails.find({ current_restaurant: _restaurantId, current_table: _tableId });
});

/**
 * Meteor publication return users by restaurants Id
 * @param {string[]} _pRestaurantsId
 */
Meteor.publish('getUsersByRestaurantsId', function (_pRestaurantsId: String[]) {
    return UserDetails.find({ current_restaurant: { $in: _pRestaurantsId } });
});

/**
 * Meteor publication return users details by admin user
 */
Meteor.publish('getUserDetailsByAdminUser', function (_userId: string) {
    check(_userId, String);
    let _lRestaurantsId: string[] = [];
    Restaurants.collection.find({ creation_user: _userId }).fetch().forEach(function <Restaurant>(restaurant, index, arr) {
        _lRestaurantsId.push(restaurant._id);
    });
    return UserDetails.find({ current_restaurant: { $in: _lRestaurantsId } });
});

Meteor.publish('getUserDetailsByRestaurantWork', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if (_lUserDetail) {
        return UserDetails.find({ current_restaurant: _lUserDetail.restaurant_work });
    } else {
        return;
    }
});