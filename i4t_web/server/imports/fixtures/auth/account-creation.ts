import { Accounts } from 'meteor/accounts-base';

Accounts.onCreateUser(function (options, user) {

    user.profile                     = options.profile || {};
    user.profile.first_name          = options.profile.first_name;
    user.profile.last_name           = options.profile.last_name;
    user.profile.language_code       = options.profile.language_code;

    // Returns the user object
    return user;
});