import { Meteor } from 'meteor/meteor';
import { EmailContents } from '../../../../both/collections/general/email-content.collection';

/**
 * Meteor publication EmailContents
 */
Meteor.publish('getEmailContents', function () {
    return EmailContents.find({});
});