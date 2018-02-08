import { Meteor } from 'meteor/meteor';
import { Cities } from '../../../../both/collections/general/city.collection';
import { Establishments } from '../../../../both/collections/establishment/establishment.collection';
import { check } from 'meteor/check';

/**
 * Meteor publication cities
 */
Meteor.publish('cities', () => Cities.find({ is_active: true }));

/**
 * City by establishment
 */
Meteor.publish('getCityByEstablishmentId', function (_establishmentId: string) {
    check(_establishmentId, String);
    let establishment = Establishments.findOne({ _id: _establishmentId });
    if (establishment) {
        return Cities.find({ _id: establishment.cityId });
    } else {
        return Cities.find({ is_active: true });
    }
});


/**
 * Meteor publications cities by country
 */
Meteor.publish('citiesByCountry', function (_countryId: string) {
    check(_countryId, String);
    return Cities.find({ country: _countryId, is_active: true });
});