import { MongoObservable } from 'meteor-rxjs';
import { Currency } from '../../models/general/currency.model';
import { Meteor } from 'meteor/meteor';

export const Currencies = new MongoObservable.Collection<Currency>('currencies');

function loggedIn(){
    return !!Meteor.user();
}

Currencies.allow({
    insert: loggedIn,
    update: loggedIn
});