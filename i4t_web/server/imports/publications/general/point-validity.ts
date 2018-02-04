import { Meteor } from 'meteor/meteor';
import { PointsValidity } from '../../../../both/collections/general/point-validity.collection';

/**
 * Meteor publication points validity
 */
Meteor.publish('pointsValidity', () => PointsValidity.find());