import { Restaurants } from '../../../both/collections/restaurant/restaurant.collection';
import { UserDetails } from '../../../both/collections/auth/user-detail.collection';
import { Sections } from '../../../both/collections/menu/section.collection';
import { Categories } from '../../../both/collections/menu/category.collection';
import { Subcategories } from '../../../both/collections/menu/subcategory.collection';
import { Additions } from '../../../both/collections/menu/addition.collection';
import { Items } from '../../../both/collections/menu/item.collection';
import { GarnishFoodCol } from '../../../both/collections/menu/garnish-food.collection';
import { PaymentMethods } from '../../../both/collections/general/paymentMethod.collection';
import { PaymentsHistory } from '../../../both/collections/payment/payment-history.collection';
import { Accounts } from '../../../both/collections/restaurant/account.collection';
import { Orders } from '../../../both/collections/restaurant/order.collection';
import { Tables } from '../../../both/collections/restaurant/table.collection';
import { Payments } from '../../../both/collections/restaurant/payment.collection';
import { WaiterCallDetails } from '../../../both/collections/restaurant/waiter-call-detail.collection';
import { CcPaymentMethods } from '../../../both/collections/payment/cc-payment-methods.collection';
import { PaymentTransactions } from '../../../both/collections/payment/payment-transaction.collection';
import { Invoices } from '../../../both/collections/restaurant/invoice.collection';
import { Cities } from '../../../both/collections/general/city.collection';
import { Countries } from '../../../both/collections/general/country.collection';
import { Languages } from '../../../both/collections/general/language.collection';

export function createdbindexes(){

    // Restaurant Collection Indexes
    Restaurants.collection._ensureIndex( { creation_user: 1 } );
    Restaurants.collection._ensureIndex( { name: 1 } );    
    Restaurants.collection._ensureIndex( { isActive: 1 } );    

    // User Collections Indexes
    UserDetails.collection._ensureIndex( { user_id: 1 } );
    UserDetails.collection._ensureIndex( { restaurant_work: 1 } );
    UserDetails.collection._ensureIndex( { current_restaurant: 1, current_table: 1 } );    

    // Section Collection Indexes
    Sections.collection._ensureIndex( { creation_user: 1 } );
    Sections.collection._ensureIndex( { restaurants: 1 } );    

    // Category Collection Indexes
    Categories.collection._ensureIndex( { creation_user: 1 } );
    Categories.collection._ensureIndex( { section: 1 } );    

    // Subcategory Collection Indexes
    Subcategories.collection._ensureIndex( { creation_user: 1 } );
    Subcategories.collection._ensureIndex( { category: 1 } );

    // Addition Collection Indexes
    Additions.collection._ensureIndex( { creation_user: 1 } );
    Additions.collection._ensureIndex( { restaurants: 1 } );    

    // Item Collection Indexes
    Items.collection._ensureIndex( { additionsIsAccepted: 1 } );
    Items.collection._ensureIndex( { garnishFoodIsAcceped: 1 } );
    Items.collection._ensureIndex( { creation_user: 1 } );
    Items.collection._ensureIndex( { sectionId: 1 } );
    Items.collection._ensureIndex( { restaurants: 1 } );

    // GarnishFood Collection Indexes
    GarnishFoodCol.collection._ensureIndex( { creation_user: 1 } );
    GarnishFoodCol.collection._ensureIndex( { restaurants: 1 } );

    // PaymentMethod Collection Indexes
    PaymentMethods.collection._ensureIndex( { isActive: 1 } );   
    
    // PaymentsHistory Collection Indexes
    PaymentsHistory.collection._ensureIndex( { restaurantIds: 1 } );
    PaymentsHistory.collection._ensureIndex( { creation_user: 1 } );
    PaymentsHistory.collection._ensureIndex( { creation_date: 1 } );

    // Accounts Collection Indexes
    Accounts.collection._ensureIndex( { restaurantId: 1 } );
    Accounts.collection._ensureIndex( { status: 1 } );
    Accounts.collection._ensureIndex( { tableId: 1 } );

    // Tables Collection Indexes
    Tables.collection._ensureIndex( { QR_code: 1 } );
    Tables.collection._ensureIndex( { restaurantId: 1 } );    

    // Orders Collection Indexes
    Orders.collection._ensureIndex( { restaurantId: 1 } );
    Orders.collection._ensureIndex( { tableId: 1 } );
    Orders.collection._ensureIndex( { status: 1 } );
    Orders.collection._ensureIndex( { accountId: 1 } );

    // Payments Collection Indexes
    Payments.collection._ensureIndex( { creation_user: 1 } );
    Payments.collection._ensureIndex( { restaurantId: 1, tableId: 1, status: 1 } );
    
    // WaiterCallDetails Collection Indexes
    WaiterCallDetails.collection._ensureIndex( { status: 1 } );
    WaiterCallDetails.collection._ensureIndex( { user_id: 1 } );
    WaiterCallDetails.collection._ensureIndex( { restaurant_id: 1, table_id: 1, type: 1 } );    

    // CcPaymentMethods Collection Indexes
    CcPaymentMethods.collection._ensureIndex( { is_active: 1 } );

    // PaymentTransactions Collection Indexes
    PaymentTransactions.collection._ensureIndex( { creation_user: 1 } );

    // Invoices Collection Indexes
    Invoices.collection._ensureIndex( { customer_id: 1 } );

    // Cities Collection Indexes
    Cities.collection._ensureIndex( { country: 1 } );
    Cities.collection._ensureIndex( { is_active: 1 } );

    // Countries Collection Indexes
    Countries.collection._ensureIndex( { is_active: 1 } );

    // Languages Collection Indexes
    Languages.collection._ensureIndex( { is_active: 1 } );
}