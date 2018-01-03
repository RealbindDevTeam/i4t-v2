import { Meteor } from 'meteor/meteor';
import { Languages } from '../../../../both/collections/general/language.collection';

/**
 * Meteor publication languages
 */
Meteor.publish( 'languages', () => Languages.find( { is_active: true } ) );