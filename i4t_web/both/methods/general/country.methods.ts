import { Meteor } from 'meteor/meteor';
import { Countries } from '../../collections/general/country.collection';
import { Country } from '../../models/general/country.model';
import { Establishments } from '../../collections/establishment/establishment.collection';
import { Establishment } from '../../models/establishment/establishment.model';
import { Tables } from '../../collections/establishment/table.collection';
import { Table } from '../../models/establishment/table.model';

if (Meteor.isServer) {

    Meteor.methods({
        getCountryByEstablishmentId: function (_establishmentId: string) {

            let tables_length: number;
            let country: Country;
            let establishment: Establishment;

            establishment = Establishments.collection.findOne({ _id: _establishmentId });
            country = Countries.findOne({ _id: establishment.countryId });

            return country.name;
        }
    });
}