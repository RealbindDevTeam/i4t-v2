import { Meteor } from 'meteor/meteor';
import { UserLogin  } from '../../models/auth/user-login.model';
import { UsersLogin } from '../../collections/auth/user-login.collection';
import { Accounts } from 'meteor/accounts-base';

if (Meteor.isServer) {
    Meteor.methods({
        insertUserLoginInfo: function (_pUserLogin: UserLogin) {
            UsersLogin.insert(_pUserLogin);
        },

        changeUserPassword: function (_userId: string, _newPassword: string) {
            Accounts.setPassword(_userId, _newPassword);
        }
    });
}