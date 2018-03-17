import { Meteor } from 'meteor/meteor';
import { TypesOfFood } from '../../../../both/collections/general/type-of-food.collection';

/**
 * Meteor publication typesOfFood
 */
Meteor.publish('typesOfFood', () => TypesOfFood.find());