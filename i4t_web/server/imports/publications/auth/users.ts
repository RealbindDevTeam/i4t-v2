import { Meteor } from 'meteor/meteor';
import { Users } from '../../../../both/collections/auth/user.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { Establishments } from '../../../../both/collections/establishment/establishment.collection';
import { Establishment } from '../../../../both/models/establishment/establishment.model';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { check } from 'meteor/check';

Meteor.publish('getUserSettings', function () {
    return Users.find({ _id: this.userId }, { fields: { username: 1, "services.profile.name": 1, "services.facebook": 1, "services.twitter": 1, "services.google": 1 } });
});

/**
 * Meteor publish, get all users
 */
Meteor.publish('getUsers', function () {
    return Users.find({});
});

/**
 * Meteor publish. Get user by Id
 */
Meteor.publish('getUserByUserId', function (_usrId: string) {
    return Users.find({ _id: _usrId });
});

/**
 * Meteor publication return users with establishment and table Id conditions
 * @param {string} _pEstablishmentId
 * @param {string} _pTableId
 */
Meteor.publish('getUserByTableId', function (_pEstablishmentId: string, _pTableId) {
    check(_pEstablishmentId, String);
    check(_pTableId, String);
    let _lUsers: string[] = [];
    UserDetails.collection.find({ current_establishment: _pEstablishmentId, current_table: _pTableId }).fetch().forEach(function <UserDetail>(user, index, arr) {
        _lUsers.push(user.user_id);
    });
    return Users.find({ _id: { $in: _lUsers } });
});

/**
 * Meteor publication return users by admin user Id
 */
Meteor.publish('getUsersByAdminUser', function (_pUserId: string) {
    check(_pUserId, String);
    let _lEstablishmentsId: string[] = [];
    let _lUsers: string[] = [];
    Establishments.collection.find({ creation_user: _pUserId }).fetch().forEach(function <Establishment>(establishment, index, arr) {
        _lEstablishmentsId.push(establishment._id);
    });
    UserDetails.collection.find({ current_establishment: { $in: _lEstablishmentsId } }).fetch().forEach(function <UserDetail>(userDetail, index, arr) {
        _lUsers.push(userDetail.user_id);
    });
    return Users.find({ _id: { $in: _lUsers } });
});

/**
 * Meteor publication return users with establishment condition
 * @param {string} _pEstablishmentId
 */
Meteor.publish('getUsersByEstablishmentId', function (_pEstablishmentId: string) {
    check(_pEstablishmentId, String);
    let _lUsers: string[] = [];
    UserDetails.collection.find({ current_establishment: _pEstablishmentId }).fetch().forEach(function <UserDetail>(user, index, arr) {
        _lUsers.push(user.user_id);
    });
    return Users.find({ _id: { $in: _lUsers } });
});