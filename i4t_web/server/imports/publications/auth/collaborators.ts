import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Users } from '../../../../both/collections/auth/user.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { User } from '../../../../both/models/auth/user.model';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';


Meteor.publish('getUsersDetailsForEstablishment', function (_establishment_work: string) {
    if (_establishment_work) {
        return UserDetails.find({ establishment_work: _establishment_work });
    }
});

Meteor.publish('getUsersByEstablishment', function (_establishment_work: string) {
    if (_establishment_work) {
        let _lUserDetails: string[] = [];
        check(_establishment_work, String);

        UserDetails.collection.find({ establishment_work: _establishment_work }).fetch().forEach(function <UserDetail>(usdet, index, arr) {
            _lUserDetails.push(usdet.user_id);
        });
        return Users.find({ _id: { $in: _lUserDetails } });
    }
});

/**
 * Get users with role '200' by current establishment.
 * @param { string } _usrId
 */;
Meteor.publish('getWaitersByCurrentEstablishment', function (_usrId: string) {
    let _lUserDetail = UserDetails.find({ user_id: _usrId }).fetch()[0];
    if (_lUserDetail) {
        return UserDetails.find({ establishment_work: _lUserDetail.current_establishment, role_id: '200' });
    }
});