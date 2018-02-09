import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { OrderHistory } from '../../models/establishment/order-history.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * OrderHistories Collection
 */
export const OrderHistories = new MongoObservable.Collection<OrderHistory>('order_histories');

/**
 * Allow OrderHistories collection insert and update functions
 */
OrderHistories.allow({
    insert: loggedIn
});