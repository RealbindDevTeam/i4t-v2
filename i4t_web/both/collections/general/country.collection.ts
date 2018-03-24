import { MongoObservable } from 'meteor-rxjs'
import { Country } from '../../models/general/country.model';
import { Meteor } from 'meteor/meteor';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Countries Collection
 */
export const Countries = new MongoObservable.Collection<Country>('countries');

/**
 * Allow Countries collection insert and update functions
 */
Countries.allow({
    insert: loggedIn,
    update: loggedIn
});