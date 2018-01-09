import { InitialComponent } from '../pages/auth/initial/initial';
import { SignupComponent } from '../pages/auth/signup/signup';
import { SigninComponent } from '../pages/auth/signin/signin';
import { TabsPage } from '../pages/customer/tabs/tabs';
import { OrdersPage } from '../pages/customer/orders/orders';
import { PaymentsPage } from '../pages/customer/payments/payments';
import { WaiterCallPage } from '../pages/customer/waiter-call/waiter-call';
import { OptionsPage } from '../pages/customer/options/options';
import { SettingsPage } from '../pages/customer/options/settings/settings';
import { ChangeEmailPage } from '../pages/customer/options/settings/change-email/change-email';
import { ChangePasswordPage } from '../pages/customer/options/settings/change-password/change-password';
import { CodeTypeSelectPage } from '../pages/customer/code-type-select/code-type-select';
import { AlphanumericCodePage } from '../pages/customer/alphanumeric-code/alphanumeric-code';
import { SectionsPage } from '../pages/customer/sections/sections';
import { AdditionsPage } from '../pages/customer/sections/additions/additions';
import { ItemDetailPage } from '../pages/customer/item-detail/item-detail';
import { ModalObservations } from '../pages/customer/item-detail/modal-observations';
import { ItemEditPage } from '../pages/customer/item-edit/item-edit';
import { ModalObservationsEdit } from '../pages/customer/item-edit/modal-observations-edit';
import { CallsPage } from '../pages/waiter/calls/calls';
import { ItemCardComponent } from '../pages/customer/sections/item-card';
import { OrderDetailComponent } from '../pages/customer/orders/order-detail';
import { OrderItemDetailComponent } from '../pages/customer/orders/order-item-detail';
import { ColombiaPaymentsPage } from '../pages/customer/payments/country-payment/colombia-payment/colombia-payment';
import { ModalColombiaPayment } from '../pages/customer/payments/country-payment/colombia-payment/modal-colombia-payment';
import { ColombiaPaymentDetailsPage } from '../pages/customer/payments/country-payment/colombia-payment/colombia-payment-details/colombia-payment-details';
import { ColombiaPaymentItemDetailComponent } from '../pages/customer/payments/country-payment/colombia-payment/colombia-payment-details/colombia-payment-item-detail';
import { OrderPaymentTranslatePage } from '../pages/customer/payments/country-payment/order-payment-translate/order-payment-translate';
import { AddOrderPaymentPage } from '../pages/customer/payments/country-payment/order-payment-translate/add-order-payment/add-order-payment';
import { AdditionOrderDetailComponent } from '../pages/customer/payments/country-payment/order-payment-translate/add-order-payment/addition-order-detail';
import { OrderPaymentDetailComponent } from '../pages/customer/payments/country-payment/order-payment-translate/order-payment-detail';
import { PaymentConfirmPage } from "../pages/waiter/calls/payment-confirm/payment-confirm";
import { PaymentDetailConfirmComponent } from "../pages/waiter/calls/payment-confirm/payment-detail-confirm";
import { ItemDetailPaymentConfirmComponent } from "../pages/waiter/calls/payment-confirm/item-detail-payment-confirm";
import { AdditionEditPage } from "../pages/customer/addition-edit/addition-edit";
import { SendOrderDetailsPage } from "../pages/waiter/calls/send-order-detail/send-order-detail";
import { ItemDetailSendOrderComponent } from "../pages/waiter/calls/send-order-detail/item-detail-send-order";
import { GarnishSendOrderComponent } from "../pages/waiter/calls/send-order-detail/garnish-food";
import { AdditionsSendOrderComponent } from "../pages/waiter/calls/send-order-detail/addition";
import { ColombiaPayInfoPage } from '../pages/customer/payments/country-payment/colombia-payment/colombia-pay-info/colombia-pay-info';
import { OrderDetailPayInfoPage } from '../pages/customer/payments/country-payment/colombia-payment/colombia-pay-info/order-detail-pay-info';
import { ItemPayInfoComponent } from '../pages/customer/payments/country-payment/colombia-payment/colombia-pay-info/item-pay-info/item-pay-info';
import { AdditionPayInfoComponent } from '../pages/customer/payments/country-payment/colombia-payment/colombia-pay-info/addition-pay-info/addition-pay-info';
import { PaymentsHistoryPage } from '../pages/customer/options/payments-history/payments-history';
import { PaymentsHistoryDetailPage } from '../pages/customer/options/payments-history/payments-history-detail/payments-history-detail';
import { Menu } from '../pages/waiter/menu/menu';
import { ChangeTablePage } from '../pages/customer/options/table-change/table-change';
import { AlphanumericCodeChangePage } from '../pages/customer/options/table-change/alphanumeric-code-change/alphanumeric-code-change';
import { EstablishmentExitPage } from '../pages/customer/options/establishment-exit/establishment-exit';
import { HomePage } from '../pages/customer/home/home';
import { HomeMenu } from '../pages/customer/home-menu/home-menu';
import { EstablishmentMenuPage } from '../pages/waiter/establishment-menu/establishment-menu';
import { ItemCardWaiterComponent } from '../pages/waiter/establishment-menu/item-card-waiter';
import { ItemDetailWaiterPage } from '../pages/waiter/item-detail-waiter/item-detail-waiter';
import { AdditionsWaiterPage } from '../pages/waiter/establishment-menu/additions-waiter/additions-waiter';
import { EstablishmentExitConfirmPage } from '../pages/waiter/calls/establishment-exit-confirm/establishment-exit-confirm';
import { EstablishmentProfilePage } from '../pages/customer/establishment-profile/establishment-profile';
import { ModalSchedule } from '../pages/customer/establishment-profile/modal-schedule/modal-schedule';

export const PAGES_DECLARATIONS = [
    InitialComponent,
    SignupComponent,
    TabsPage,
    OrdersPage,
    PaymentsPage,
    WaiterCallPage,
    OptionsPage,
    SettingsPage,
    ChangeEmailPage,
    ChangePasswordPage,
    CodeTypeSelectPage,
    AlphanumericCodePage,
    SigninComponent,
    SectionsPage,
    AdditionsPage,
    ItemDetailPage,
    ModalObservations,
    ItemEditPage,
    ModalObservationsEdit,
    CallsPage,
    ItemCardComponent,
    OrderDetailComponent,
    OrderItemDetailComponent,
    ColombiaPaymentsPage,
    ModalColombiaPayment,
    ColombiaPaymentDetailsPage,
    ColombiaPaymentItemDetailComponent,
    OrderPaymentTranslatePage,
    AddOrderPaymentPage,
    AdditionOrderDetailComponent,
    OrderPaymentDetailComponent,
    PaymentConfirmPage,
    PaymentDetailConfirmComponent,
    ItemDetailPaymentConfirmComponent,
    AdditionEditPage,
    SendOrderDetailsPage,
    ItemDetailSendOrderComponent,
    GarnishSendOrderComponent,
    AdditionsSendOrderComponent,
    ColombiaPayInfoPage,
    OrderDetailPayInfoPage,
    ItemPayInfoComponent,
    AdditionPayInfoComponent,
    PaymentsHistoryPage,
    PaymentsHistoryDetailPage,
    Menu,
    ChangeTablePage,
    AlphanumericCodeChangePage,
    EstablishmentExitPage,
    HomePage,
    HomeMenu,
    EstablishmentMenuPage,
    ItemCardWaiterComponent,
    ItemDetailWaiterPage,
    AdditionsWaiterPage,
    EstablishmentExitConfirmPage,
    EstablishmentProfilePage,
    ModalSchedule
];