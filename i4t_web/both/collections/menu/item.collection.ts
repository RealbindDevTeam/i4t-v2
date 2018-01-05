import { MongoObservable } from 'meteor-rxjs';
import { Item, ItemImage } from '../../models/menu/item.model';

/**
 * Function to validate if user exists
 */
function loggedIn() {
    return !!Meteor.user();
}

/**
 * Items Collection
 */
export const Items = new MongoObservable.Collection<Item>('items');

/**
 * Allow Items collection insert and update functions
 */
Items.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});