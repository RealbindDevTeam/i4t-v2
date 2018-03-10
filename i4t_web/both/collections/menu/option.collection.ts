import { MongoObservable } from 'meteor-rxjs';
import { Option } from '../../models/menu/option.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Options Collection
 */
export const Options = new MongoObservable.Collection<Option>('options');

/**
 * Allow Options collection insert and update functions
 */
Options.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});