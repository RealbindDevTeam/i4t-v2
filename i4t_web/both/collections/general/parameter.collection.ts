import { MongoObservable } from 'meteor-rxjs';
import { Parameter } from '../../models/general/parameter.model';
import { Meteor } from 'meteor/meteor';

export const Parameters = new MongoObservable.Collection<Parameter>('parameters');

function loggedIn(){
    return !!Meteor.user();
}

Parameters.allow({
    insert: loggedIn,
    update: loggedIn
});