import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Users Collection
 */
export const Users = MongoObservable.fromExisting(Meteor.users);

/**
 * Allow Users collection update functions
 */
Users.allow({
    update: loggedIn
});