import { MongoObservable } from 'meteor-rxjs';
import { GarnishFood } from '../../models/menu/garnish-food.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Garnish Food Collecion
 */
export const GarnishFoodCol = new MongoObservable.Collection<GarnishFood>('garnishFood');

/**
 * Allow Garnish Food collection insert and update functions
 */
GarnishFoodCol.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});