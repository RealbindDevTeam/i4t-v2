import { MongoObservable } from 'meteor-rxjs';
import { UserDevice } from '../../models/auth/device.model';

export const UserDevices = new MongoObservable.Collection<UserDevice>('user_devices');

function loggedIn(){
    return !!Meteor.user();
}

UserDevices.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn,
});