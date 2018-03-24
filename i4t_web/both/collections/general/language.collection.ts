import { MongoObservable } from 'meteor-rxjs';
import { Language } from '../../models/general/language.model';
import { Meteor } from 'meteor/meteor';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Languages Collection
 */
export const Languages = new MongoObservable.Collection<Language>('languages');

/**
 * Allow Languages collection insert and update functions
 */
Languages.allow({
    insert: loggedIn,
    update: loggedIn
});