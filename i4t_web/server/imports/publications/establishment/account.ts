import { Meteor } from 'meteor/meteor';
import { Accounts } from '../../../../both/collections/establishment/account.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { Establishments } from '../../../../both/collections/establishment/establishment.collection';
import { Establishment } from '../../../../both/models/establishment/establishment.model';
import { check } from 'meteor/check';

/**
 * Meteor publication accounts with establishmentId condition and tableId condition
 * @param {string} _establishmentId
 * @param {string} _status
 */
Meteor.publish('getAccountsByTableEstablishment', function (_establishmentId: string, _status: string) {
    check(_establishmentId, String);
    check(_status, String);
    return Accounts.find({ establishment_id: _establishmentId, status: _status });
});

/**
 * Meteor publication account by tableId
 * @param {string} _tableId
 */
Meteor.publish('getAccountsByTableId', function (_tableId: string) {
    check(_tableId, String);
    return Accounts.find({ tableId: _tableId });
});

/**
 * Meteor publication account by userId
 * @param {string} userId
 */
Meteor.publish('getAccountsByUserId', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if (_lUserDetail) {
        if (_lUserDetail.current_establishment !== "" && _lUserDetail.current_table !== "") {
            return Accounts.find({ establishment_id: _lUserDetail.current_establishment, tableId: _lUserDetail.current_table, status: 'OPEN' });
        } else {
            return;
        }
    } else {
        return;
    }

});

/**
 * Meteor publication return accounts by admin user establishments
 * @param {string} _userId
 */
Meteor.publish('getAccountsByAdminUser', function (_userId: string) {
    check(_userId, String);
    let _lEstablishmentsId: string[] = [];
    Establishments.collection.find({ creation_user: _userId }).fetch().forEach(function <Establishment>(establishment, index, arr) {
        _lEstablishmentsId.push(establishment._id);
    });
    return Accounts.find({ establishment_id: { $in: _lEstablishmentsId }, status: 'OPEN' });
});

/**
 * Meteor publication return accounts by establishment work
 * @param {string} _userId
 */
Meteor.publish('getAccountsByEstablishmentWork', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if (_lUserDetail) {
        return Accounts.find({ establishment_id: _lUserDetail.establishment_work, status: 'OPEN' });
    } else {
        return;
    }
});