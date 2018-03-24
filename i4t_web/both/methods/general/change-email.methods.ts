import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Users } from '../../collections/auth/user.collection';
import { User } from '../../models/auth/user.model';

if (Meteor.isServer) {

    Meteor.methods({
        addEmail: function ( newEmail : string ) {
            Accounts.addEmail(Meteor.userId(), newEmail, true);
        }
    });
    
    Meteor.methods({
        removeEmail: function ( oldEmail : string ) {
            Accounts.removeEmail(Meteor.userId(), oldEmail);
        }
    });

}