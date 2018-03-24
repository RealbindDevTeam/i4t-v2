import { MongoObservable } from 'meteor-rxjs';
import { Point } from '../../models/general/point.model';
import { Meteor } from 'meteor/meteor';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Points Collection
 */
export const Points = new MongoObservable.Collection<Point>('points');

/**
 * Allow points collection insert and update functions
 */
Points.allow({
    insert: loggedIn,
    update: loggedIn
});