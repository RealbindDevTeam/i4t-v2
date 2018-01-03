import { MongoObservable } from 'meteor-rxjs';
import { UserDetail } from '../../models/auth/user-detail.model';

export const UserDetails = new MongoObservable.Collection<UserDetail>('user_details');

function loggedIn(){
    return !!Meteor.user();
}

UserDetails.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn,
});
