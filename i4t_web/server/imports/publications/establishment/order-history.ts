import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { OrderHistory } from '../../../../both/models/establishment/order-history.model';
import { OrderHistories } from '../../../../both/collections/establishment/order-history.collection';

/**
 * Meteor publication return orders history by user Id
 * @param {string} _userId
 * @param {string} _establishmentId
 */
Meteor.publish('getOrdersHistoryByUserId', function (_userId: string, _establishmentId: string) {
    check(_userId, String);
    check(_establishmentId, String);
    return OrderHistories.find({ customer_id: _userId, establishment_id: _establishmentId });
});

/**
 * Meteor publication return orders history by establishment Id
 * @param {string} _establishmentId
 */
Meteor.publish('getOrderHistoryByEstablishment', function (_establishmentId: string) {
    check(_establishmentId, String);
    return OrderHistories.find({ establishment_id: _establishmentId })
});

/**
 * Meteor publication return orders history by establishment Ids
 * @param {string[]} _establishmentIds
 */
Meteor.publish('getOrderHistoryByEstablishmentIds', function (_pEstablishmentIds: string[]) {
    return OrderHistories.find({ establishment_id: { $in: _pEstablishmentIds } })
});

