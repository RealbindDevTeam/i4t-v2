import { Meteor } from 'meteor/meteor';
import { IurestInvoices } from '../../../../both/collections/payment/iurest-invoices.collection';

/**
 * Meteor publication InvoicesInfo
 */
Meteor.publish('getAllIurestInvoices', function () {
    return IurestInvoices.find({});
});

Meteor.publish('getIurestInvoiceByUser', function (_userId: string) {
    check(_userId, String);
    return IurestInvoices.find({ creation_user: _userId });
});