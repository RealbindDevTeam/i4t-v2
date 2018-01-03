import { Meteor } from 'meteor/meteor';
import { Users } from '../../../../both/collections/auth/user.collection';
import { Roles } from '../../../../both/collections/auth/role.collection';
import { Menus } from '../../../../both/collections/auth/menu.collection';
import { User } from '../../../../both/models/auth/user.model';

Meteor.publish('getMenus', function () {
    return Menus.find({}, { sort: { order: 1 } });
});