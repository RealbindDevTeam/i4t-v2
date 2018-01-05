import { Meteor } from 'meteor/meteor';
import { Categories } from '../../../../both/collections/menu/category.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { Sections } from '../../../../both/collections/menu/section.collection';
import { check } from 'meteor/check';

/**
 * Meteor publication categories with creation user condition
 * @param {string} _userId
 */
Meteor.publish('categories', function (_userId: string) {
    check(_userId, String);
    return Categories.find({ creation_user: _userId });
});

/**
 * Meteor publication return categories with establishment condition
 * @param {string} _establishmentId
 */
Meteor.publish('categoriesByEstablishment', function (_establishmentId: string) {
    let _sections: string[] = [];
    check(_establishmentId, String);

    Sections.collection.find({ establishments: { $in: [_establishmentId] }, is_active: true }).fetch().forEach(function <String>(s, index, arr) {
        _sections.push(s._id);
    });
    return Categories.find({ section: { $in: _sections }, is_active: true });
});

/**
 * Meteor ppublication return categories by establishment work
 * @param {string} _userId
 */
Meteor.publish('getCategoriesByEstablishmentWork', function (_userId: string) {
    check(_userId, String);
    let _sections: string[] = [];
    let user_detail = UserDetails.findOne({ user_id: _userId });
    if (user_detail) {
        Sections.collection.find({ establishments: { $in: [user_detail.establishment_work] }, is_active: true }).fetch().forEach(function <String>(s, index, arr) {
            _sections.push(s._id);
        });
        return Categories.find({ section: { $in: _sections }, is_active: true });
    } else {
        return;
    }
});