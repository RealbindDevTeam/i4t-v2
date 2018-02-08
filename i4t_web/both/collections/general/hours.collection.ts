import { MongoObservable } from 'meteor-rxjs';
import { Hour } from '../../models/general/hour.model';
import { Meteor } from 'meteor/meteor';

export const Hours = new MongoObservable.Collection<Hour>('hours');

function loggedIn(){
    return !!Meteor.user();
}

Hours.allow({
    insert: loggedIn,
    update: loggedIn
});