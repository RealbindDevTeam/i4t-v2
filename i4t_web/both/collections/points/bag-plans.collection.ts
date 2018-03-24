import { MongoObservable } from 'meteor-rxjs';
import { BagPlan } from '../../models/points/bag-plan.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * BagPlans Collection
 */
export const BagPlans = new MongoObservable.Collection<BagPlan>('bag_plans');

BagPlans.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn,
});