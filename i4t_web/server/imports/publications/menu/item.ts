import { Meteor } from 'meteor/meteor';
import { Items } from '../../../../both/collections/menu/item.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { check } from 'meteor/check';

/**
 * Meteor publication items with creation user condition
 * @param {string} _userId
 */
Meteor.publish('items', function (_userId: string) {
    check(_userId, String);
    return Items.find({ creation_user: _userId });
});

/**
 * Meteor publication return items with restaurant condition
 */
Meteor.publish('itemsByRestaurant', function (_restaurantId: string) {
    check(_restaurantId, String);
    return Items.find({ 'restaurants.restaurantId': { $in: [_restaurantId] }, is_active: true });
});

/**
 * Meteor publication return items with user condition
 */
Meteor.publish('itemsByUser', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });

    if (_lUserDetail) {
        if (_lUserDetail.current_restaurant) {
            return Items.find({ 'restaurants.restaurantId': { $in: [_lUserDetail.current_restaurant] }, is_active: true });
        } else {
            return;
        }
    } else {
        return;
    }
});

/**
 * Meteor publication return item by id
 */
Meteor.publish('itemById', function (_itemId: string) {
    check(_itemId, String);
    return Items.find({ _id: _itemId });
});

/**
 * Meteor publication return items by restaurant work
 * @param {string} _userId
 */
Meteor.publish('getItemsByRestaurantWork', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    let _sections: string[] = [];

    if (_lUserDetail) {
        if (_lUserDetail.restaurant_work) {
            return Items.find({ 'restaurants.restaurantId': { $in: [_lUserDetail.restaurant_work] }, is_active: true });
        } else {
            return;
        }
    } else {
        return;
    }
});

/**
 * Meteor publication return restaurants items
 * @param {string[]} _pRestaurantIds
 */
Meteor.publish('getItemsByRestaurantIds', function (_pRestaurantIds: string[]) {
    return Items.find({ 'restaurants.restaurantId': { $in: _pRestaurantIds } });
});


/**
 * Meetor publication return items by restaurant work
 * @param {string} _userId
 */
Meteor.publish('getItemsByUserRestaurantWork', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });

    if (_lUserDetail) {
        if (_lUserDetail.restaurant_work) {
            return Items.find({ 'restaurants.restaurantId': { $in: [_lUserDetail.restaurant_work] }, is_active: true });
        } else {
            return;
        }
    } else {
        return;
    }
});
