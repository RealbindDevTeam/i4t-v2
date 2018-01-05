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
 * Meteor publication establishments sections 
 * @param {string} _establishmentId
*/
Meteor.publish('sectionsByEstablishment', function (_establishmentId: string) {
    check(_establishmentId, String);
    return Sections.find({ establishments: { $in: [_establishmentId] }, is_active: true });
});

Meteor.publish('getSections', function () {
    return Sections.find({});
});

/**
 * Meteor publication establishments sections by establishment work
 * @param {string} _userId
*/
Meteor.publish('getSectionsByEstablishmentWork', function (_userId: string) {
    check(_userId, String);
    let user_detail = UserDetails.findOne({ user_id: _userId });
    if( user_detail ){
        return Sections.find({ establishments: { $in: [user_detail.establishment_work] }, is_active: true });
    } else {
        return;
    }
});