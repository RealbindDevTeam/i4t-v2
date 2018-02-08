import { Meteor } from 'meteor/meteor';
import { Parameters } from '../../../../both/collections/general/parameter.collection';

/**
 * Meteor publication EmailContents
 */
Meteor.publish('getParameters', function () {
    return Parameters.find({});
});