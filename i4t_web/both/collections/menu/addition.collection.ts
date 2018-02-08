import { MongoObservable } from 'meteor-rxjs';
import { Addition } from '../../models/menu/addition.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Addition Collection
 */
export const Additions = new MongoObservable.Collection<Addition>('additions');

/**
 * Allow Addition collection insert and update functions
 */
Additions.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});