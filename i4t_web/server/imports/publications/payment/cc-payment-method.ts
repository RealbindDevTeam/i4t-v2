import { Meteor } from 'meteor/meteor';
import { CcPaymentMethods } from '../../../../both/collections/payment/cc-payment-methods.collection';

/**
 * Meteor publication EmailContents
 */
Meteor.publish('getCcPaymentMethods', function () {
    return CcPaymentMethods.find({ is_active: true });
});