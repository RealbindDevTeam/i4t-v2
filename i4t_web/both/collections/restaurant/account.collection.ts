import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { Account } from '../../models/restaurant/account.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Accounts Collection
 */
export const Accounts = new MongoObservable.Collection<Account>('accounts');

/**
 * Allow Accounts collection insert and update functions
 */
Accounts.allow({
    insert: loggedIn,
    update: loggedIn
});