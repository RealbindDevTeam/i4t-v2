import { SyncedCron } from 'meteor/percolate:synced-cron';
import { Countries } from '../../collections/general/country.collection';

if (Meteor.isServer) {

    /**
    * Init the cron according to the countries registered
    */


    /*
    Meteor.startup(function () {
        let activeCountries = Countries.collection.find({is_active: true}).fetch();
        activeCountries.forEach(country => {
            console.log(country._id);
        });
    });
    */

    Meteor.methods({


    });
}