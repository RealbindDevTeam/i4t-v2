import { Meteor } from 'meteor/meteor';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { Establishments } from '../../../../both/collections/establishment/establishment.collection';

Meteor.publish('getUsersDetails', function () {
    return UserDetails.find({});
});

Meteor.publish('getUserDetailsByUser', function (_userId: string) {
    check(_userId, String);
    return UserDetails.find({ user_id: _userId });
});

Meteor.publish('getUserDetailsByCurrentTable', function (_establishmentId: string, _tableId: string) {
    return UserDetails.find({ current_establishment: _establishmentId, current_table: _tableId });
});

/**
 * Meteor publication return users by establishments Id
 * @param {string[]} _pEstablishmentsId
 */
Meteor.publish('getUsersByEstablishmentsId', function (_pEstablishmentsId: String[]) {
    return UserDetails.find({ current_establishment: { $in: _pEstablishmentsId } });
});

/**
 * Meteor publication return users details by admin user
 */
Meteor.publish('getUserDetailsByAdminUser', function (_userId: string) {
    check(_userId, String);
    let _lEstablishmentsId: string[] = [];
    Establishments.collection.find({ creation_user: _userId }).fetch().forEach(function <Establishment>(establishment, index, arr) {
        _lEstablishmentsId.push(establishment._id);
    });
    return UserDetails.find({ current_establishment: { $in: _lEstablishmentsId } });
});

Meteor.publish('getUserDetailsByEstablishmentWork', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if (_lUserDetail) {
        return UserDetails.find({ current_establishment: _lUserDetail.establishment_work });
    } else {
        return;
    }
});

/**
 * Meteor publication return establishment collaborators
 */
Meteor.publish('getUsersCollaboratorsByEstablishmentsId', function (_pEstablishmentsId: string[]) {
    return UserDetails.find({ establishment_work: { $in: _pEstablishmentsId } });
});