import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { IurestInvoice } from '../../models/payment/iurest-invoice.model';

export const IurestInvoices = new MongoObservable.Collection<IurestInvoice>('iurest_invoice');

/**
 * Function to validate if user exists
 */
function loggedIn() {
    return !!Meteor.user();
}

/**
 * Allow HistoryPaymentCollection collecion insert and update functions
 */
IurestInvoices.allow({
    insert: loggedIn,
    update: loggedIn
});
