import { Meteor } from 'meteor/meteor';
import { OptionValues } from '../../../../both/collections/menu/option-value.collection';
import { check } from 'meteor/check';

/**
 * Meteor publication option values with creation user condition
 * @param {string} _userId
 */
Meteor.publish('getAdminOptionValues', function (_userId: string) {
    check(_userId, String);
    return OptionValues.find({ creation_user: _userId });
});
