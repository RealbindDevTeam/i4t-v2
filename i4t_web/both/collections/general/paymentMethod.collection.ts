import { MongoObservable } from 'meteor-rxjs';
import { PaymentMethod } from '../../models/general/paymentMethod.model';
import { Meteor } from 'meteor/meteor';

export const PaymentMethods = new MongoObservable.Collection<PaymentMethod>('paymentMethods');

function loggedIn(){
    return !!Meteor.user();
}

PaymentMethods.allow({
    insert: loggedIn,
    update: loggedIn
});