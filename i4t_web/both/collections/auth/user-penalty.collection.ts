import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { UserPenalty } from '../../models/auth/user-penalty.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * User Penalties Collection
 */
export const UserPenalties = new MongoObservable.Collection<UserPenalty>('user_penalties');

/**
 * Allow User Penalties collection insert and update functions
 */
UserPenalties.allow({
    insert: loggedIn,
    update: loggedIn
});
