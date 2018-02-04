import { Meteor } from 'meteor/meteor';

import './imports/publications/menu/sections';
import './imports/publications/menu/categories';
import './imports/publications/menu/subcategories';
import './imports/publications/menu/additions';
import './imports/publications/menu/garnish-food';
import './imports/publications/menu/item';
import './imports/publications/auth/users';
import './imports/publications/auth/roles';
import './imports/publications/auth/menus';
import './imports/publications/auth/collaborators';
import './imports/publications/auth/user-details';
import './imports/publications/general/hour';
import './imports/publications/general/currency';
import './imports/publications/general/paymentMethod';
import './imports/publications/general/email-content';
import './imports/publications/general/parameter';
import './imports/publications/general/cities';
import './imports/publications/general/countries';
import './imports/publications/general/languages';
import './imports/publications/payment/payment-history';
import './imports/publications/payment/cc-payment-method';
import './imports/publications/payment/payment-transaction';
import './imports/publications/payment/invoice-info';
import './imports/publications/payment/iurest-invoices';
import './imports/publications/establishment/establishment';
import './imports/publications/establishment/table';
import './imports/publications/establishment/order';
import './imports/publications/establishment/waiter-call';
import './imports/publications/establishment/reward';
import './imports/publications/establishment/reward-point';
import './imports/publications/establishment/order-history';
import './imports/publications/general/point';
import './imports/publications/general/cooking-time';
import './imports/publications/general/point-validity';

import '../both/methods/menu/item.methods';
import '../both/methods/auth/collaborators.methods';
import '../both/methods/auth/menu.methods';
import '../both/methods/auth/user-detail.methods';
import '../both/methods/auth/user-devices.methods';
import '../both/methods/auth/user-login.methods';
import '../both/methods/auth/user.methods';
import '../both/methods/general/cron.methods';
import '../both/methods/general/email.methods';
import '../both/methods/general/parameter.methods';
import '../both/methods/general/change-email.methods';
import '../both/methods/general/country.methods';
import '../both/methods/general/iurest-invoice.methods';
import '../both/methods/general/push-notifications.methods';
import '../both/methods/establishment/establishment.methods';
import '../both/methods/establishment/order-history.methods';
import '../both/methods/establishment/order.methods';
import '../both/methods/establishment/schedule.methods';
import '../both/methods/establishment/table.method';
import '../both/methods/establishment/waiter-queue/waiter-queue.methods';
import '../both/methods/establishment/waiter-queue/queues.methods';

import './imports/fixtures/auth/account-creation';
import './imports/fixtures/auth/email-config';
import { removeFixtures } from './imports/fixtures/remove-fixtures';
import { loadRoles } from './imports/fixtures/auth/roles';
import { loadMenus } from './imports/fixtures/auth/menus';
import { loadHours } from './imports/fixtures/general/hours';
import { loadCurrencies } from './imports/fixtures/general/currencies';
import { loadPaymentMethods } from './imports/fixtures/general/paymentMethods';
import { loadCountries } from './imports/fixtures/general/countries';
import { loadCities } from './imports/fixtures/general/cities';
import { loadLanguages } from './imports/fixtures/general/languages';
import { loadEmailContents } from './imports/fixtures/general/email-contents';
import { loadParameters } from './imports/fixtures/general/parameters';
import { loadCcPaymentMethods } from './imports/fixtures/payments/cc-payment-methods';
import { loadInvoicesInfo } from './imports/fixtures/payments/invoices-info';
import { loadPoints } from './imports/fixtures/general/point';
import { loadCookingTimes } from './imports/fixtures/general/cooking-time';
import { loadPointsValidity } from './imports/fixtures/general/point-validity';
import { createdbindexes } from './imports/indexes/indexdb';
import { createCrons } from './cron';

Meteor.startup(() => {
    removeFixtures();
    loadMenus();
    loadRoles();
    loadHours();
    loadCurrencies();
    loadPaymentMethods();
    loadCountries();
    loadCities();
    loadLanguages();
    createdbindexes();
    loadEmailContents();
    loadParameters();
    loadCcPaymentMethods();
    loadInvoicesInfo();
    loadPoints();
    loadCookingTimes();
    loadPointsValidity();
    createCrons();
});
