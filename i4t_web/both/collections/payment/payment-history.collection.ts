import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { PaymentHistory } from '../../models/payment/payment-history.model';

export const PaymentsHistory = new MongoObservable.Collection<PaymentHistory>('payments_history');

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Allow HistoryPaymentCollection collecion insert and update functions
 */
PaymentsHistory.allow({
    insert: loggedIn,
    update: loggedIn
});