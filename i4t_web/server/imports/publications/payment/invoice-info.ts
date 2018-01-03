import { Meteor } from 'meteor/meteor';
import { InvoicesInfo } from '../../../../both/collections/payment/invoices-info.collection';

/**
 * Meteor publication InvoicesInfo
 */
Meteor.publish('getInvoicesInfoByCountry', function (countryId: string) {
    return InvoicesInfo.find({ country_id: countryId });
});
