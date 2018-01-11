import { Meteor } from 'meteor/meteor';
import { Points } from '../../../../both/collections/general/point.collection';

/**
 * Meteor publication points
 */
Meteor.publish('points', () => Points.find());