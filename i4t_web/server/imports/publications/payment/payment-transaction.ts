import { Meteor } from 'meteor/meteor';
import { PaymentTransactions } from '../../../../both/collections/payment/payment-transaction.collection';

/**
 * Meteor publication EmailContents
 */
Meteor.publish('getTransactions', function () {
    return PaymentTransactions.find({});
});

Meteor.publish('getTransactionsByUser', function (_userId: string) {
    return PaymentTransactions.find({ creation_user: _userId });
});