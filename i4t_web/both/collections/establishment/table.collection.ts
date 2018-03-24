import { MongoObservable } from 'meteor-rxjs';
import { Table } from '../../models/establishment/table.model';
import { Meteor } from 'meteor/meteor';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Tables Collection
 */
export const Tables = new MongoObservable.Collection<Table>('tables');

/**
 * Allow Tables collection insert and update functions
 */
Tables.allow({
    insert: loggedIn,
    update: loggedIn
});