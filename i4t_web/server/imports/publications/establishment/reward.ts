import { Meteor } from 'meteor/meteor';
import { Rewards } from '../../../../both/collections/establishment/reward.collection';
import { check } from 'meteor/check';

/**
 * Meteor publication rewards with creation user condition
 */
Meteor.publish('getRewards', function (_userId: string) {
    check(_userId, String);
    return Rewards.find({ creation_user: _userId });
});

/**
 * Meteor publication return rewards by establishment Id
 */
Meteor.publish('getEstablishmentRewards', function (_establishmentId: string) {
    check(_establishmentId, String);
    return Rewards.find({ establishments: { $in: [_establishmentId] }, is_active: true });
});