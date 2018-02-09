import { MongoObservable } from 'meteor-rxjs'
import { Queue } from '../../models/general/queue.model';
import { Meteor } from 'meteor/meteor';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Queues Collection
 */
export const Queues = new MongoObservable.Collection<Queue>('queues');

/**
 * Allow Queues collection insert and update functions
 */
Queues.allow({
    insert: loggedIn,
    update: loggedIn
});