import { Meteor } from 'meteor/meteor';
import { Hours } from '../../../../both/collections/general/hours.collection';

/**
 * Meteor publication hours
 */
Meteor.publish('hours', () => Hours.find());