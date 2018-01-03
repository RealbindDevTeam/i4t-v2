import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { Invoice } from '../../models/restaurant/invoice.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Invoices Collection
 */
export const Invoices = new MongoObservable.Collection<Invoice>('invoices');

/**
 * Allow Invoices collection insert and update functions
 */
Invoices.allow({
    insert: loggedIn
});