import { MongoObservable } from 'meteor-rxjs';
import { Section } from '../../models/menu/section.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Section Collection
 */
export const Sections = new MongoObservable.Collection<Section>('sections');

/**
 * Allow Section collection insert and update functions
 */
Sections.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});