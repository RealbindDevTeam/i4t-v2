import { Meteor } from 'meteor/meteor';
import { Options } from '../../../../both/collections/menu/option.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { check } from 'meteor/check';

/**
 * Meteor publication option with creation user condition
 * @param {String} _userId
 */
Meteor.publish('getAdminOptions', function (_userId: string) {
    check(_userId, String);
    return Options.find({ creation_user: _userId });
});

/**
 * Meteor publication establishments options 
 * @param {string} _establishmentId
*/
Meteor.publish('optionsByEstablishment', function (_establishmentsId: string[]) {
    return Options.find({ establishments: { $in: _establishmentsId }, is_active: true });
});