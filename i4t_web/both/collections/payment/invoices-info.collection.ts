import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { InvoiceInfo } from '../../models/payment/invoice-info.model';

export const InvoicesInfo = new MongoObservable.Collection<InvoiceInfo>('invoices_info');

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Allow HistoryPaymentCollection collecion insert and update functions
 */
InvoicesInfo.allow({
    insert: loggedIn,
    update: loggedIn
});