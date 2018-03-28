import { Establishments, EstablishmentsProfile } from '../../../both/collections/establishment/establishment.collection';
import { UserDetails } from '../../../both/collections/auth/user-detail.collection';
import { Sections } from '../../../both/collections/menu/section.collection';
import { Categories } from '../../../both/collections/menu/category.collection';
import { Subcategories } from '../../../both/collections/menu/subcategory.collection';
import { Additions } from '../../../both/collections/menu/addition.collection';
import { Items } from '../../../both/collections/menu/item.collection';
import { PaymentMethods } from '../../../both/collections/general/paymentMethod.collection';
import { PaymentsHistory } from '../../../both/collections/payment/payment-history.collection';
import { Orders } from '../../../both/collections/establishment/order.collection';
import { Tables } from '../../../both/collections/establishment/table.collection';
import { WaiterCallDetails } from '../../../both/collections/establishment/waiter-call-detail.collection';
import { CcPaymentMethods } from '../../../both/collections/payment/cc-payment-methods.collection';
import { PaymentTransactions } from '../../../both/collections/payment/payment-transaction.collection';
import { OrderHistories } from '../../../both/collections/establishment/order-history.collection';
import { Cities } from '../../../both/collections/general/city.collection';
import { Countries } from '../../../both/collections/general/country.collection';
import { Languages } from '../../../both/collections/general/language.collection';
import { RewardPoints } from '../../../both/collections/establishment/reward-point.collection';
import { Rewards } from '../../../both/collections/establishment/reward.collection';
import { Parameters } from '../../../both/collections/general/parameter.collection';
import { OptionValues } from '../../../both/collections/menu/option-value.collection';
import { Options } from '../../../both/collections/menu/option.collection';
import { InvoicesInfo } from '../../../both/collections/payment/invoices-info.collection';
import { EstablishmentPoints } from '../../../both/collections/points/establishment-points.collection';
import { NegativePoints } from '../../../both/collections/points/negative-points.collection';

export function createdbindexes() {

    // Establishment Collection Indexes
    Establishments.collection._ensureIndex({ creation_user: 1 });
    Establishments.collection._ensureIndex({ name: 1 });
    Establishments.collection._ensureIndex({ isActive: 1 });

    // Establishment Profile Collection Indexes
    EstablishmentsProfile.collection._ensureIndex({ establishment_id: 1 });

    // User Collections Indexes
    UserDetails.collection._ensureIndex({ user_id: 1 });
    UserDetails.collection._ensureIndex({ establishment_work: 1 });
    UserDetails.collection._ensureIndex({ current_establishment: 1, current_table: 1 });

    // Section Collection Indexes
    Sections.collection._ensureIndex({ creation_user: 1 });
    Sections.collection._ensureIndex({ establishments: 1 });

    // Category Collection Indexes
    Categories.collection._ensureIndex({ creation_user: 1 });
    Categories.collection._ensureIndex({ section: 1 });

    // Subcategory Collection Indexes
    Subcategories.collection._ensureIndex({ creation_user: 1 });
    Subcategories.collection._ensureIndex({ category: 1 });

    // Addition Collection Indexes
    Additions.collection._ensureIndex({ creation_user: 1 });
    Additions.collection._ensureIndex({ establishments: 1 });

    // Item Collection Indexes
    Items.collection._ensureIndex({ creation_user: 1 });
    Items.collection._ensureIndex({ sectionId: 1 });
    Items.collection._ensureIndex({ establishments: 1 });

    // PaymentMethod Collection Indexes
    PaymentMethods.collection._ensureIndex({ isActive: 1 });

    // PaymentsHistory Collection Indexes
    PaymentsHistory.collection._ensureIndex({ establishment_ids: 1 });
    PaymentsHistory.collection._ensureIndex({ creation_user: 1 });
    PaymentsHistory.collection._ensureIndex({ creation_date: 1 });

    // Tables Collection Indexes
    Tables.collection._ensureIndex({ QR_code: 1 });
    Tables.collection._ensureIndex({ establishment_id: 1 });

    // Orders Collection Indexes
    Orders.collection._ensureIndex({ establishment_id: 1 });
    Orders.collection._ensureIndex({ tableId: 1 });
    Orders.collection._ensureIndex({ status: 1 });

    // WaiterCallDetails Collection Indexes
    WaiterCallDetails.collection._ensureIndex({ status: 1 });
    WaiterCallDetails.collection._ensureIndex({ user_id: 1 });
    WaiterCallDetails.collection._ensureIndex({ establishment_id: 1, table_id: 1, type: 1 });

    // CcPaymentMethods Collection Indexes
    CcPaymentMethods.collection._ensureIndex({ is_active: 1 });

    // PaymentTransactions Collection Indexes
    PaymentTransactions.collection._ensureIndex({ creation_user: 1 });

    // OrderHistories Collection Indexes
    OrderHistories.collection._ensureIndex({ customer_id: 1, establishment_id: 1 });

    // Cities Collection Indexes
    Cities.collection._ensureIndex({ country: 1 });
    Cities.collection._ensureIndex({ is_active: 1 });

    // Countries Collection Indexes
    Countries.collection._ensureIndex({ is_active: 1 });

    // Languages Collection Indexes
    Languages.collection._ensureIndex({ is_active: 1 });

    // RewardPoints Collection Indexes
    RewardPoints.collection._ensureIndex({ id_user: 1 });

    // Rewards Collection Indexes
    Rewards.collection._ensureIndex({ establishments: 1 });
    Rewards.collection._ensureIndex({ item_id: 1 });

    // Parameters Collection Indexes
    Parameters.collection._ensureIndex({ name: 1 });

    // OptionValues Collection Indexes
    OptionValues.collection._ensureIndex({ creation_user: 1 });
    OptionValues.collection._ensureIndex({ option_id: 1 });

    // Options Collection Indexes
    Options.collection._ensureIndex({ creation_user: 1 });
    Options.collection._ensureIndex({ establishments: 1 });

    // InvoicesInfo Collection Indexes
    InvoicesInfo.collection._ensureIndex({ country_id: 1 });

    // EstablishmentPoints Collection Indexes
    EstablishmentPoints.collection._ensureIndex({ establishment_id: 1 });

    // NegativePoints Collection Indexes
    NegativePoints.collection._ensureIndex({ establishment_id: 1 });
}