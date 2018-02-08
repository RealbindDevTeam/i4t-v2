import { MongoObservable } from 'meteor-rxjs';
import { City } from '../../models/general/city.model';
import { Meteor } from 'meteor/meteor';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Cities Collection
 */
export const Cities = new MongoObservable.Collection<City>('cities');

/**
 * Allow Cities collection insert and update functions
 */
Cities.allow({
    insert: loggedIn,
    update: loggedIn
});