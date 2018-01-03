import { Meteor } from 'meteor/meteor';
import { Countries } from '../../../../both/collections/general/country.collection';
import { Restaurants } from '../../../../both/collections/restaurant/restaurant.collection';
import { Restaurant } from '../../../../both/models/restaurant/restaurant.model';
import { check } from 'meteor/check';

/**
 * Meteor publication countries
 */
Meteor.publish('countries', function () {
    return Countries.find({ is_active: true });
});

/**
 * Country by restaurant
 */
Meteor.publish('getCountryByRestaurantId', function (_restaurantId: string) {
    check(_restaurantId, String);
    let restaurant = Restaurants.findOne({ _id: _restaurantId });
    if (restaurant) {
        return Countries.find({ _id: restaurant.countryId });
    } else {
        return Countries.find({ is_active: true });;
    }
});

/**
 * Meteor publication return countries by restaurants Id
 */
Meteor.publish('getCountriesByRestaurantsId', function (_restaurantsId: string[]) {
    let _ids: string[] = [];
    Restaurants.collection.find({ _id: { $in: _restaurantsId } }).forEach(function <Restaurant>(restaurant, index, ar) {
        _ids.push(restaurant.countryId);
    });
    return Countries.find({ _id: { $in: _ids } });
});


/**
 * Meteor publicaation return countries by admin user Id
 */
Meteor.publish('getCountriesByAdminUser', function () {
    let _countriesIds: string[] = [];
    Restaurants.collection.find({ creation_user: this.userId }).forEach(function <Restaurant>(restaurant, index, ar) {
        _countriesIds.push(restaurant.countryId);
    });

    return Countries.find({ _id: { $in: _countriesIds }, is_active: true });
});