import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { PointValidity } from '../../models/general/point-validity.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Points Validity Collection
 */
export const PointsValidity = new MongoObservable.Collection<PointValidity>('points_validity');

/**
 * Allow points validity collection insert and update functions
 */
PointsValidity.allow({
    insert: loggedIn,
    update: loggedIn
});