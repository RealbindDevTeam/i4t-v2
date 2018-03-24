import { Menus } from '../../../both/collections/auth/menu.collection';
import { Roles } from '../../../both/collections/auth/role.collection';
import { Hours } from '../../../both/collections/general/hours.collection';
import { Currencies } from '../../../both/collections/general/currency.collection';
import { PaymentMethods } from '../../../both/collections/general/paymentMethod.collection';
import { Countries } from '../../../both/collections/general/country.collection';
import { Cities } from '../../../both/collections/general/city.collection';
import { Languages } from '../../../both/collections/general/language.collection';
import { EmailContents } from '../../../both/collections/general/email-content.collection';
import { Parameters } from '../../../both/collections/general/parameter.collection';
import { CcPaymentMethods } from '../../../both/collections/payment/cc-payment-methods.collection'
import { Points } from '../../../both/collections/general/point.collection';
import { CookingTimes } from '../../../both/collections/general/cooking-time.collection';
import { TypesOfFood } from '../../../both/collections/general/type-of-food.collection';
import { BagPlans } from "../../../both/collections/points/bag-plans.collection";

export function removeFixtures() {
    /**
     * Remove Menus Collection
     */
    Menus.remove({});

    /**
     * Remove Roles Collection
     */
    Roles.remove({});

    /**
     * Remove Hours Collection
     */
    Hours.remove({});

    /**
     * Remove Currencies Collection
     */
    Currencies.remove({});

    /**
     * Remove PaymentMethods Collection
     */
    PaymentMethods.remove({});

    /**
     * Remove Countries Collection
     */
    Countries.remove({});

    /**
     * Remove Cities Collection
     */
    Cities.remove({});

    /**
     * Remove Languages Collection
     */
    Languages.remove({});

    /**
     * Remove EmailContents Collection
     */
    EmailContents.remove({});

    /**
     * Remove Parameters Collection
     */
    Parameters.remove({});

    /**
     * Remove CcPaymentMethods Collection
     */
    CcPaymentMethods.remove({});

    /**
     * Remove Points Collection
     */
    Points.remove({});

    /**
     * Remove CookingTimes Collection
     */
    CookingTimes.remove({});

    /**
     * Remove TypesOfFood Collection
     */
    TypesOfFood.remove({});

    /**
     * Remove BagPlans Collection
     */
    BagPlans.remove({});
}