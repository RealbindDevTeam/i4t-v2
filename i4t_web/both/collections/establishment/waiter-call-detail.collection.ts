import { MongoObservable } from 'meteor-rxjs';
import { WaiterCallDetail } from '../../models/establishment/waiter-call-detail.model';
import { Meteor } from 'meteor/meteor';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * WaiterCallDetails Collection
 */
export const WaiterCallDetails = new MongoObservable.Collection<WaiterCallDetail>('waiter_call_details');

/**
 * Allow WaiterCallDetails collection insert and update functions
 */
WaiterCallDetails.allow({
    insert: loggedIn,
    update: loggedIn
});