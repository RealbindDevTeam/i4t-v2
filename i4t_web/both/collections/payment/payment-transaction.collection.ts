import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { PaymentTransaction } from '../../models/payment/payment-transaction.model';

export const PaymentTransactions = new MongoObservable.Collection<PaymentTransaction>('payment_transaction');

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Allow HistoryPaymentCollection collecion insert and update functions
 */
PaymentTransactions.allow({
    insert: loggedIn,
    update: loggedIn
});