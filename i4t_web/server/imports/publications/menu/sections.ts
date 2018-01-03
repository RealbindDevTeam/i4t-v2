import { Meteor } from 'meteor/meteor';
import { Sections } from '../../../../both/collections/menu/section.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { check } from 'meteor/check';

/**
 * Meteor publication section with creation user condition
 * @param {String} _userId
 */
Meteor.publish('sections', function (_userId: string) {
    check(_userId, String);
    return Sections.find({ creation_user: _userId });
});

/**
 * Meteor publication restaurants sections 
 * @param {string} _restaurantId
*/
Meteor.publish('sectionsByRestaurant', function (_restaurantId: string) {
    check(_restaurantId, String);
    return Sections.find({ restaurants: { $in: [_restaurantId] }, is_active: true });
});

Meteor.publish('getSections', function () {
    return Sections.find({});
});

/**
 * Meteor publication restaurants sections by restaurant work
 * @param {string} _userId
*/
Meteor.publish('getSectionsByRestaurantWork', function (_userId: string) {
    check(_userId, String);
    let user_detail = UserDetails.findOne({ user_id: _userId });
    if( user_detail ){
        return Sections.find({ restaurants: { $in: [user_detail.restaurant_work] }, is_active: true });
    } else {
        return;
    }
});