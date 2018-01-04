import { MongoObservable } from 'meteor-rxjs';
import { Subcategory } from '../../models/menu/subcategory.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Subcategory Collection
 */
export const Subcategories = new MongoObservable.Collection<Subcategory>('subcategories');

/**
 * Allow Subcategory collection insert and update functions
 */
Subcategories.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});