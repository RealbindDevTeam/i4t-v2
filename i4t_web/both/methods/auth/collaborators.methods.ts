import { Meteor } from 'meteor/meteor';
import { UserDetails } from '../../collections/auth/user-detail.collection';

if (Meteor.isServer) {
    Meteor.methods({
        createCollaboratorUser: function ( _info : any ) {
            var result = Accounts.createUser({
                email: _info.email,
                password: _info.password,
                username: _info.username,
                profile: _info.profile,
            });

            return result;
        }
    });
}


    
