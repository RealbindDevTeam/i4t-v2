import { BagPlan, PricePoints } from '../../../../both/models/points/bag-plan.model';
import { BagPlans } from '../../../../both/collections/points/bag-plans.collection';

export function loadBagPlans() {
    if (BagPlans.find().cursor.count() == 0) {
        const bagPlans: BagPlan[] = [
            {
                _id: '100',
                name: 'free',
                label: 'BAG_PLAN.FREE',
                price: {
                    country_id: "1900",
                    price: 27900,
                },
                value_points: 500,
                active: true,
            },
            {
                _id: '200',
                name: 'medium',
                label: 'BAG_PLAN.MEDIUM',
                price: {
                    country_id: "1900",
                    price: 31900,
                },
                value_points: 1000,
                active: true,
            },
            {
                _id: '300',
                name: 'BAG_PLAN.LARGE',
                label: '',
                price: {
                    country_id: "1900",
                    price: 34900,
                },
                value_points: 1500,
                active: true,
            }
        ];

        bagPlans.forEach((bagPlan: BagPlan) => BagPlans.insert(bagPlan));
    }
}