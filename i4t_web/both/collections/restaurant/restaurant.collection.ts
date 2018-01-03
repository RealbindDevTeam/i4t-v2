import { MongoObservable } from 'meteor-rxjs';
import { Restaurant, RestaurantTurn, RestaurantLegality, RestaurantProfile, RestaurantProfileImage } from '../../models/restaurant/restaurant.model';
import { Meteor } from 'meteor/meteor';

/**
 * Function to validate if user exists
 */
function loggedIn() {
    return !!Meteor.user();
}

/**
 * Restaurants Collection
 */
export const Restaurants = new MongoObservable.Collection<Restaurant>('restaurants');

/**
 * Allow Restaurant collecion insert and update functions
 */
Restaurants.allow({
    insert: loggedIn,
    update: loggedIn
});

/**
 * Restaurants Collection
 */

export const RestaurantTurns = new MongoObservable.Collection<RestaurantTurn>('restaurant_turns');

/**
 * Allow Restaurant Turns collection insert and update functions
 */
RestaurantTurns.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});

/**
 * Restaurant Legality Collection
 */
export const RestaurantsLegality = new MongoObservable.Collection<RestaurantLegality>('restaurants_legality');

/**
 * Allow Restaurant Legality collection insert and update functions
 */
RestaurantsLegality.allow({
    insert: loggedIn,
    update: loggedIn
});

/**
 * Restaurant Profile Collection
 */
export const RestaurantsProfile = new MongoObservable.Collection<RestaurantProfile>('restaurants_profile');

/**
 * Allow Restaurant Profile collection insert and update functions
 */
RestaurantsProfile.allow({
    insert: loggedIn,
    update: loggedIn
});
