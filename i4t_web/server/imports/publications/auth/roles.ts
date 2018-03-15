import { Meteor } from 'meteor/meteor';
import { Users } from '../../../../both/collections/auth/user.collection';
import { User } from '../../../../both/models/auth/user.model';
import { Roles } from '../../../../both/collections/auth/role.collection';

Meteor.publish('getRoleComplete', function () {
    return Roles.find({});
});

Meteor.publish('getRoleCollaborators', function () {
    return Roles.find({_id: { $in: [ "200", "300", "600" ] }});
});