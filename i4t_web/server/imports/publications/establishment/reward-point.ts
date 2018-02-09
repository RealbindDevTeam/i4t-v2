import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { RewardPoint } from '../../../../both/models/establishment/reward-point.model';
import { RewardPoints } from '../../../../both/collections/establishment/reward-point.collection';

/**
 * Meteor publication return user reward points
 * @param {string} _user_id
 */
Meteor.publish('getRewardPointsByUserId', function (_user_id: string) {
    check(_user_id, String);
    return RewardPoints.find({ id_user: _user_id });
});