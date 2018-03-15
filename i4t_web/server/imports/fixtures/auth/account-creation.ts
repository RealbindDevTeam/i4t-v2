import { Accounts } from 'meteor/accounts-base';

Accounts.onCreateUser(function (options, user) {

    user.profile = options.profile || {};
    user.profile.full_name = options.profile.full_name;
    user.profile.language_code = options.profile.language_code;
    user.profile.gender = options.profile.gender;

    // Returns the user object
    return user;
});