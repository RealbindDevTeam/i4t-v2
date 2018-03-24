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
 * Meteor publication return subcategories with establishment condition
 * @param {string} _establishmentId
 */
Meteor.publish('subcategoriesByEstablishment', function (_establishmentId: string) {
    let _sections: string[] = [];
    let _categories: string[] = [];
    check(_establishmentId, String);

    Sections.collection.find({ establishments: { $in: [_establishmentId] }, is_active: true }).fetch().forEach(function <String>(s, index, arr) {
        _sections.push(s._id);
    });
    Categories.collection.find({ section: { $in: _sections }, is_active: true }).fetch().forEach(function <String>(c, index, arr) {
        _categories.push(c._id);
    });
    return Subcategories.find({ category: { $in: _categories }, is_active: true });
});


/**
 * Meteor publication return subcategories by establishment work
 * @param {string} _userId
 */
Meteor.publish('getSubcategoriesByEstablishmentWork', function (_userId: string) {
    check(_userId, String);
    let _sections: string[] = [];
    let _categories: string[] = [];
    let user_detail = UserDetails.findOne({ user_id: _userId });
    if (user_detail) {
        Sections.collection.find({ establishments: { $in: [user_detail.establishment_work] }, is_active: true }).fetch().forEach(function <String>(s, index, arr) {
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