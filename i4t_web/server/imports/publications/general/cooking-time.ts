import { Meteor } from 'meteor/meteor';
import { CookingTimes } from '../../../../both/collections/general/cooking-time.collection';

/**
 * Meteor publication cooking times
 */
Meteor.publish('cookingTimes', () => CookingTimes.find());