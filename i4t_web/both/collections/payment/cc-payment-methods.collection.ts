import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { CcPaymentMethod } from '../../models/payment/cc-payment-method.model';

export const CcPaymentMethods = new MongoObservable.Collection<CcPaymentMethod>('cc_payment_methods');

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Allow HistoryPaymentCollection collecion insert and update functions
 */
CcPaymentMethods.allow({
    insert: loggedIn,
    update: loggedIn
});