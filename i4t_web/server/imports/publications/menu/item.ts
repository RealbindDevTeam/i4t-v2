import { Meteor } from 'meteor/meteor';
import { Items } from '../../../../both/collections/menu/item.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { check } from 'meteor/check';

/**
 * Meteor publication items with creation user condition
 * @param {string} _userId
 */
Meteor.publish('items', function (_userId: string) {
    check(_userId, String);
    return Items.find({ creation_user: _userId });
});

/**
 * Meteor publication admin active items
 * @param {string} _userId
 */
Meteor.publish('getAdminActiveItems', function (_userId: string) {
    check(_userId, String);
    return Items.find({ creation_user: _userId, is_active: true });
});

/**
 * Meteor publication return items with establishment condition
 */
Meteor.publish('itemsByEstablishment', function (_establishmentId: string) {
    check(_establishmentId, String);
    return Items.find({ 'establishments.establishment_id': { $in: [_establishmentId] }, is_active: true });
});

/**
 * Meteor publication return items with user condition
 */
Meteor.publish('itemsByUser', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });

    if (_lUserDetail) {
        if (_lUserDetail.current_establishment) {
            return Items.find({ 'establishments.establishment_id': { $in: [_lUserDetail.current_establishment] }, is_active: true });
        } else {
            return;
        }
    } else {
        return;
    }
});

/**
 * Meteor publication return item by id
 */
Meteor.publish('itemById', function (_itemId: string) {
    check(_itemId, String);
    return Items.find({ _id: _itemId });
});

/**
 * Meteor publication return items by establishment work
 * @param {string} _userId
 */
Meteor.publish('getItemsByEstablishmentWork', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    let _sections: string[] = [];

    if (_lUserDetail) {
        if (_lUserDetail.establishment_work) {
            return Items.find({ 'establishments.establishment_id': { $in: [_lUserDetail.establishment_work] }, is_active: true });
        } else {
            return;
        }
    } else {
        return;
    }
});

/**
 * Meteor publication return establishments items
 * @param {string[]} _pEstablishmentIds
 */
Meteor.publish('getItemsByEstablishmentIds', function (_pEstablishmentIds: string[]) {
    return Items.find({ 'establishments.establishment_id': { $in: _pEstablishmentIds } });
});


/**
 * Meetor publication return items by establishment work
 * @param {string} _userId
 */
Meteor.publish('getItemsByUserEstablishmentWork', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });

    if (_lUserDetail) {
        if (_lUserDetail.establishment_work) {
            return Items.find({ 'establishments.establishment_id': { $in: [_lUserDetail.establishment_work] }, is_active: true });
        } else {
            return;
        }
    } else {
        return;
    }
});


/***
 * Meteor publication return items sorted by item name
 */
/**
 * Meteor publication return items with establishment condition
 */
Meteor.publish('itemsByEstablishmentSortedByName', function (_establishmentId: string) {
    check(_establishmentId, String);
    return Items.find({ 'establishments.establishment_id': { $in: [_establishmentId] }, is_active: true }, { sort: { name: 1 } });
});

