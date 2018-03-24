import { Meteor } from 'meteor/meteor';
import { Rewards } from '../../../../both/collections/establishment/reward.collection';
import { check } from 'meteor/check';
import { Items } from '../../../../both/collections/menu/item.collection';

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

/**
 * Meteor publication to return the rewards 
 */
Meteor["publishComposite"]('getRewardsToItems', function (_establishmentId: string) {
    check(_establishmentId, String);

    if (_establishmentId !== null || _establishmentId !== '') {
        return {
            find() {
                return Items.find({ 'establishments.establishment_id': { $in: [_establishmentId] } });
            },
            children: [{
                find(item) {
                    return Rewards.find({ item_id: item._id });
                }
            }]
        }
    } else {
        return;
    }

});