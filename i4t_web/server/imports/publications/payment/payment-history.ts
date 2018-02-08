import { Meteor } from 'meteor/meteor';
import { PaymentsHistory } from '../../../../both/collections/payment/payment-history.collection';

/**
 * Meteor publication EmailContents
 */
Meteor.publish('getHistoryPaymentsByUser', function (_userId: string) {
    return PaymentsHistory.find({ creation_user: _userId, isInitial: false }, { sort: { creation_date: -1 } });
}); 