import { MongoObservable } from 'meteor-rxjs';
import { EmailContent } from '../../models/general/email-content.model';
import { Meteor } from 'meteor/meteor';

export const EmailContents =  new MongoObservable.Collection<EmailContent>('email_contents');

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * Allow EmailContents collecion insert and update functions
 */
EmailContents.allow({
    insert: loggedIn,
    update: loggedIn
});