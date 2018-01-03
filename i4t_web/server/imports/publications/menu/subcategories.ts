import { Meteor } from 'meteor/meteor';
import { Subcategories } from '../../../../both/collections/menu/subcategory.collection';
import { Sections } from '../../../../both/collections/menu/section.collection';
import { Categories } from '../../../../both/collections/menu/category.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { check } from 'meteor/check';

/**
 * Meteor publication subcategories with creation user condition
 * @param {string} _userId
 */
Meteor.publish('subcategories', function (_userId: string) {
    check(_userId, String);
    return Subcategories.find({ creation_user: _userId });
});

/**
 * Meteor publication return subcategories with restaurant condition
 * @param {string} _restaurantId
 */
Meteor.publish('subcategoriesByRestaurant', function (_restaurantId: string) {
    let _sections: string[] = [];
    let _categories: string[] = [];
    check(_restaurantId, String);

    Sections.collection.find({ restaurants: { $in: [_restaurantId] }, is_active: true }).fetch().forEach(function <String>(s, index, arr) {
        _sections.push(s._id);
    });
    Categories.collection.find({ section: { $in: _sections }, is_active: true }).fetch().forEach(function <String>(c, index, arr) {
        _categories.push(c._id);
    });
    return Subcategories.find({ category: { $in: _categories }, is_active: true });
});


/**
 * Meteor publication return subcategories by restaurant work
 * @param {string} _userId
 */
Meteor.publish('getSubcategoriesByRestaurantWork', function (_userId: string) {
    check(_userId, String);
    let _sections: string[] = [];
    let _categories: string[] = [];
    let user_detail = UserDetails.findOne({ user_id: _userId });
    if (user_detail) {
        Sections.collection.find({ restaurants: { $in: [user_detail.restaurant_work] }, is_active: true }).fetch().forEach(function <String>(s, index, arr) {
            _sections.push(s._id);
        });
        Categories.collection.find({ section: { $in: _sections }, is_active: true }).fetch().forEach(function <String>(c, index, arr) {
            _categories.push(c._id);
        });
        return Subcategories.find({ category: { $in: _categories }, is_active: true });
    } else {
        return;
    }
});