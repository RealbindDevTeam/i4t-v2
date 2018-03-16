import { SyncedCron } from 'meteor/percolate:synced-cron';
import { Countries } from '../both/collections/general/country.collection';
import { Email } from 'meteor/email';

export function createCrons() {
  let activeCountries = Countries.collection.find({ is_active: true }).fetch();
  activeCountries.forEach(country => {
    /**
    * This cron evaluates the freeDays flag on establishments with value true, and change it to false
    */
   /**
    SyncedCron.add({
      name: 'cronChangeFreeDays.' + country.name,
      schedule: function (parser) {
        return parser.cron(country.cronChangeFreeDays);
      },
      job: function () {
        Meteor.call('changeFreeDaysToFalse', country._id);
      }
    });
     */

    /**
    * This cron sends email to warn the charge soon of iurest service
    */
   /**
    SyncedCron.add({
      name: 'cronEmailChargeSoon.' + country.name,
      schedule: function (parser) {
        return parser.cron(country.cronEmailChargeSoon);
      },
      job: function () {
        Meteor.call('sendEmailChargeSoon', country._id);
      }
    });
     */

    /**
    * This cron sends email to warn the expire soon the iurest service
    */
   /**
    SyncedCron.add({
      name: 'cronEmailExpireSoon.' + country.name,
      schedule: function (parser) {
        return parser.cron(country.cronEmailExpireSoon);
      },
      job: function () {
        Meteor.call('sendEmailExpireSoon', country._id);
      }
    });
     */


    /**
     * This cron evaluates the isActive flag on establishments with value true, and insert them on history_payment collection
     */
    /**
    SyncedCron.add({
      name: 'cronValidateActive.' + country.name,
      schedule: function (parser) {
        return parser.cron(country.cronValidateActive);
      },
      job: function () {
        Meteor.call('validateActiveEstablishments', country._id);
      }
    });
     */


    /**
    * This cron sends an email to warn that the service has expired
    */
   /**
    SyncedCron.add({
      name: 'cronEmailRestExpired.' + country.name,
      schedule: function (parser) {
        return parser.cron(country.cronEmailRestExpired);
      },
      job: function () {
        Meteor.call('sendEmailRestExpired', country._id);
      }
    });
     */
    
    /**
    * This cron validate the points expiration date
    */
    SyncedCron.add({
      name: 'cronPointsExpire.' + country.name,
      schedule: function (parser) {
        return parser.cron(country.cronPointsExpire);
      },
      job: function () {
        Meteor.call('checkPointsToExpire', country._id);
      }
    });
  });
}

SyncedCron.start();