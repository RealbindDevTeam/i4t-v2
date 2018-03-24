import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { Order } from '../../models/establishment/order.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Orders Collection
 */
export const Orders = new MongoObservable.Collection<Order>('orders');

/**
 * Allow Orders collection insert and update functions
 */
Orders.allow({
    insert: loggedIn,
    update:loggedIn
});