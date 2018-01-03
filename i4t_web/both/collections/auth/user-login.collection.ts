import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { UserLogin } from '../../models/auth/user-login.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * User Login Collection
 */
export const UsersLogin = new MongoObservable.Collection<UserLogin>('users_login');

UsersLogin.allow({
    insert:loggedIn,
    update: loggedIn
});