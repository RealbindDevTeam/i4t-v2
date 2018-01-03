import { Meteor } from 'meteor/meteor';
import { Currencies } from '../../../../both/collections/general/currency.collection';
import { Restaurants } from '../../../../both/collections/restaurant/restaurant.collection';
import { Restaurant } from '../../../../both/models/restaurant/restaurant.model';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';

/**
 * Meteor publication currencies
 */
Meteor.publish('currencies', () => Currencies.find({ isActive: true }));

/**
 * Meteor publication return currencies by restaurants Id
 */
Meteor.publish('getCurrenciesByRestaurantsId', function (_restaurantsId: string[]) {
    let _ids: string[] = [];
    Restaurants.collection.find({ _id: { $in: _restaurantsId } }).forEach(function <Restaurant>(restaurant, index, ar) {
        _ids.push(restaurant.currencyId);
    });
    return Currencies.find({ _id: { $in: _ids } });
});

/**
 * Meteor publication return currencies by  userId
 */
Meteor.publish('getCurrenciesByUserId', function () {
    let _currenciesIds: string[] = [];
    Restaurants.collection.find({ creation_user: this.userId }).forEach(function <Restaurant>(restaurant, index, args) {
        _currenciesIds.push(restaurant.currencyId);
    });

    return Currencies.find({ _id: { $in: _currenciesIds } });
});

/**
 * Meteor publication return currencies by 
 */
Meteor.publish('getCurrenciesByCurrentUser', function (_userId: string) {
    let _userDetail = UserDetails.findOne({ user_id: _userId });

    if (_userDetail.current_restaurant != '') {
        let _restaurant = Restaurants.findOne({ _id: _userDetail.current_restaurant });
        return Currencies.find({ _id: _restaurant.currencyId });
    } else {
        return Currencies.find({ _id: '0' });
    }
});

/**
 * Meteor publication return currency by restaurant work
 * @param {string} _userId
 */
Meteor.publish('getCurrenciesByRestaurantWork', function (_userId: string) {
    let _userDetail = UserDetails.findOne({ user_id: _userId });
    let _currenciesIds: string[] = [];
    if (_userDetail.restaurant_work != '') {
        let _restaurant = Restaurants.findOne({ _id: _userDetail.restaurant_work });
        return Currencies.find({ _id: _restaurant.currencyId });
    } else {
        return Currencies.find({ _id: '0' });
    }
});
