import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { RewardPoint } from '../../models/establishment/reward-point.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * RewardPoints Collection
 */
export const RewardPoints = new MongoObservable.Collection<RewardPoint>('reward_points');

/**
 * Allow RewardPoints collection insert and update functions
 */
RewardPoints.allow({
    insert: loggedIn,
    update:loggedIn
});