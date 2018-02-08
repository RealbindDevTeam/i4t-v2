import { MongoObservable } from 'meteor-rxjs';
import { CookingTime } from '../../models/general/cooking-time.model';
import { Meteor } from 'meteor/meteor';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Cookingtimes Collection
 */
export const CookingTimes = new MongoObservable.Collection<CookingTime>('cooking_times');

/**
 * Allow cookingtimes collection insert and update functions
 */
CookingTimes.allow({
    insert: loggedIn,
    update: loggedIn
});