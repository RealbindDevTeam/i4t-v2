import { MongoObservable } from 'meteor-rxjs';
import { BagPlanHistory } from '../../models/points/bag-plan-history.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * BagPlanHistories Collection
 */
export const BagPlanHistories = new MongoObservable.Collection<BagPlanHistory>('bag_plan_histories');

BagPlanHistories.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn,
});