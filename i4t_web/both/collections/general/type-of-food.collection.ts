import { MongoObservable } from 'meteor-rxjs';
import { TypeOfFood } from '../../models/general/type-of-food.model';
import { Meteor } from 'meteor/meteor';

/**
 * Function to validate if user exists
 */
function loggedIn() {
    return !!Meteor.user();
}

/**
 * TypesOfFood Collection
 */
export const TypesOfFood = new MongoObservable.Collection<TypeOfFood>('types_of_food');

/**
 * Allow TypesOfFood collection insert and update functions
 */
TypesOfFood.allow({
    insert: loggedIn,
    update: loggedIn
});