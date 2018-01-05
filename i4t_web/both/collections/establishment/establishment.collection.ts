import { MongoObservable } from 'meteor-rxjs';
import { Establishment, EstablishmentTurn, EstablishmentProfile, EstablishmentProfileImage } from '../../models/establishment/establishment.model';
import { Meteor } from 'meteor/meteor';

/**
 * Function to validate if user exists
 */
function loggedIn() {
    return !!Meteor.user();
}

/**
 * Establishments Collection
 */
export const Establishments = new MongoObservable.Collection<Establishment>('establishments');

/**
 * Allow Establishment collecion insert and update functions
 */
Establishments.allow({
    insert: loggedIn,
    update: loggedIn
});

/**
 * Establishment Turns Collection
 */

export const EstablishmentTurns = new MongoObservable.Collection<EstablishmentTurn>('establishment_turns');

/**
 * Allow Establishment Turns collection insert and update functions
 */
EstablishmentTurns.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});

/**
 * Establishment Profile Collection
 */
export const EstablishmentsProfile = new MongoObservable.Collection<EstablishmentProfile>('establishment_profile');

/**
 * Allow Establishment Profile collection insert and update functions
 */
EstablishmentsProfile.allow({
    insert: loggedIn,
    update: loggedIn
});
