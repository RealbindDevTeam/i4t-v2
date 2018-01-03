import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { Payment } from '../../models/restaurant/payment.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Payments Collection
 */
export const Payments = new MongoObservable.Collection<Payment>('payments');

/**
 * Allow Payments collection insert and update functions
 */
Payments.allow({
    insert: loggedIn,
    update: loggedIn
});