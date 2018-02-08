import { Meteor } from 'meteor/meteor';
import { UserDetails } from '../../collections/auth/user-detail.collection';
import { UserDetail } from '../../models/auth/user-detail.model';

if (Meteor.isServer) {
    Meteor.methods({
        getRole: function () {
            let role: string = "";
            let userDetail = UserDetails.collection.findOne({ user_id: this.userId });
            if(userDetail){
                role = userDetail.role_id;
            }
            return role;
        },
        validateAdmin: function () {
            let role: string;
            let userDetail = UserDetails.collection.findOne({ user_id: this.userId });
            role = userDetail.role_id;
            if (role === '100') {
                return true;
            } else {
                return false;
            }
        },
        validateWaiter: function () {
            let role: string;
            let userDetail = UserDetails.collection.findOne({ user_id: this.userId });
            role = userDetail.role_id;
            if (role === '200') {
                return true;
            } else {
                return false;
            }
        },
        validateCashier: function () {
            let role: string;
            let userDetail = UserDetails.collection.findOne({ user_id: this.userId });
            role = userDetail.role_id;
            if (role === '300') {
                return true;
            } else {
                return false;
            }
        },
        validateCustomer: function () {
            let role: string;
            let userDetail = UserDetails.collection.findOne({ user_id: this.userId });
            role = userDetail.role_id;
            if (role === '400') {
                return true;
            } else {
                return false;
            }
        },
        validateChef: function () {
            let role: string;
            let userDetail = UserDetails.collection.findOne({ user_id: this.userId });
            role = userDetail.role_id;
            if (role === '500') {
                return true;
            } else {
                return false;
            }
        },
        validateAdminOrSupervisor: function () {
            let role: string;
            let userDetail = UserDetails.collection.findOne({ user_id: this.userId });
            role = userDetail.role_id;
            if (role === '100' || role === '600') {
                return true;
            } else {
                return false;
            }
        },
        getDetailsCount: function () {
            let count: number;
            count = UserDetails.collection.find({ user_id: this.userId }).count();
            return count;
        },
        /**
         * Validate user is active
         */
        validateUserIsActive : function(){
            let userDetail = UserDetails.collection.findOne({ user_id: this.userId });
            if(userDetail){
                return userDetail.is_active;
            } else {
                return false;
            }
        }
    });
}



