import { MongoObservable } from 'meteor-rxjs';
import { NegativePoint } from '../../models/points/negative-point.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * NegativePoints Collection
 */
export const NegativePoints = new MongoObservable.Collection<NegativePoint>('negative_points');

NegativePoints.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn,
});