import { Meteor } from 'meteor/meteor';
import { Countries } from '../../collections/general/country.collection';
import { Country } from '../../models/general/country.model';
import { Restaurants } from '../../collections/restaurant/restaurant.collection';
import { Restaurant } from '../../models/restaurant/restaurant.model';
import { Tables } from '../../collections/restaurant/table.collection';
import { Table } from '../../models/restaurant/table.model';

if (Meteor.isServer) {

    Meteor.methods({
        getCountryByRestaurantId: function (_restaurantId: string) {

            let tables_length: number;
            let country: Country;
            let restaurant: Restaurant;

            restaurant = Restaurants.collection.findOne({ _id: _restaurantId });
            country = Countries.findOne({ _id: restaurant.countryId });

            return country.name;
        }
    });
}