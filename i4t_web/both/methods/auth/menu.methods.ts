import { Meteor } from 'meteor/meteor';
import { Roles } from '../../collections/auth/role.collection';
import { UserDetails } from '../../collections/auth/user-detail.collection';
import { Menus } from '../../collections/auth/menu.collection';
import { Menu } from '../../models/auth/menu.model';
import { check } from 'meteor/check';


if (Meteor.isServer) {
    Meteor.methods({
        getMenus: function () {

            let menuList: Menu[] = [];
            let userDetail = UserDetails.collection.findOne({ user_id: this.userId });
            let role = Roles.collection.findOne({ _id: userDetail.role_id });
            Menus.collection.find({ _id: { $in: role.menus }, is_active: true }, { sort: { order: 1 } }).forEach(function <Menu>(menu, index, ar) {
                menuList.push(menu);
            });
            return menuList;
        }
    });
}