import { InitialComponent } from '../pages/auth/initial/initial';
import { SignupComponent } from '../pages/auth/signup/signup';
import { SigninComponent } from '../pages/auth/signin/signin';
import { OrdersPage } from '../pages/customer/orders/orders';
import { WaiterCallPage } from '../pages/customer/waiter-call/waiter-call';
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
import { PaymentConfirmPage } from "../pages/waiter/calls/payment-confirm/payment-confirm";
import { PaymentDetailConfirmComponent } from "../pages/waiter/calls/payment-confirm/payment-detail-confirm";
import { ItemDetailPaymentConfirmComponent } from "../pages/waiter/calls/payment-confirm/item-detail-payment-confirm";
import { AdditionEditPage } from "../pages/customer/addition-edit/addition-edit";
import { SendOrderDetailsPage } from "../pages/waiter/calls/send-order-detail/send-order-detail";
import { ItemDetailSendOrderComponent } from "../pages/waiter/calls/send-order-detail/item-detail-send-order";
import { GarnishSendOrderComponent } from "../pages/waiter/calls/send-order-detail/garnish-food";
import { AdditionsSendOrderComponent } from "../pages/waiter/calls/send-order-detail/addition";
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
    OrdersPage,
    WaiterCallPage,
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
    PaymentConfirmPage,
    PaymentDetailConfirmComponent,
    ItemDetailPaymentConfirmComponent,
    AdditionEditPage,
    SendOrderDetailsPage,
    ItemDetailSendOrderComponent,
    GarnishSendOrderComponent,
    AdditionsSendOrderComponent,
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