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