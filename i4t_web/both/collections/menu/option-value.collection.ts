import { MongoObservable } from 'meteor-rxjs';
import { OptionValue } from '../../models/menu/option-value.model';

/**
 * Function to validate if user exists
 */
function loggedIn() {
    return !!Meteor.user();
}

/**
 * Option Value Collection
 */
export const OptionValues = new MongoObservable.Collection<OptionValue>('option_values');

/**
 * Allow OptionValues collection insert and update functions
 */
OptionValues.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});