import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { Reward } from '../../models/establishment/reward.model';

/**
 * Function to validate if user exists
 */
function loggedIn() {
    return !!Meteor.user();
}

/**
 * Reward Collection
 */
export const Rewards = new MongoObservable.Collection<Reward>('rewards');

/**
 * Allow Reward collection insert, update and remove functions
 */
Rewards.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});