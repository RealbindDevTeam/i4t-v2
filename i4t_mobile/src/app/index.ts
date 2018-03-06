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
import { AdditionEditPage } from "../pages/customer/addition-edit/addition-edit";
import { SendOrderDetailsPage } from "../pages/waiter/calls/send-order-detail/send-order-detail";
import { ItemDetailSendOrderComponent } from "../pages/waiter/calls/send-order-detail/item-detail-send-order";
import { GarnishSendOrderComponent } from "../pages/waiter/calls/send-order-detail/garnish-food";
import { AdditionsSendOrderComponent } from "../pages/waiter/calls/send-order-detail/addition";
import { ChangeTablePage } from '../pages/customer/options/table-change/table-change';
import { AlphanumericCodeChangePage } from '../pages/customer/options/table-change/alphanumeric-code-change/alphanumeric-code-change';
import { EstablishmentExitPage } from '../pages/customer/options/establishment-exit/establishment-exit';
import { HomePage } from '../pages/customer/home/home';
import { HomeMenu } from '../pages/customer/home-menu/home-menu';
import { EstablishmentMenuPage } from '../pages/waiter/establishment-menu/establishment-menu';
import { ItemCardWaiterComponent } from '../pages/waiter/establishment-menu/item-card-waiter';
import { ItemDetailWaiterPage } from '../pages/waiter/item-detail-waiter/item-detail-waiter';
import { AdditionsWaiterPage } from '../pages/waiter/establishment-menu/additions-waiter/additions-waiter';
import { EstablishmentProfilePage } from '../pages/customer/establishment-profile/establishment-profile';
import { ModalSchedule } from '../pages/customer/establishment-profile/modal-schedule/modal-schedule';
import { CustomerOrderConfirm } from "../pages/waiter/calls/customer-order-confirm/customer-order-confirm";
import { RewardListComponent } from '../pages/customer/orders/reward-list';
import { PointsPage } from '../pages/customer/points/points/points';
import { PointsDetailPage } from '../pages/customer/points/points-detail/points-detail';
import { OptionsPage } from '../pages/customer/options/options';
import { SegmentsPage } from '../pages/customer/segments/segments';
import { PopoverOptionsPage } from '../pages/customer/home/popover-options/popover-options';
import { OrderConfirmPage } from '../pages/customer/orders/order-confirm/order-confirm';
import { TabsPage } from '../pages/waiter/tabs/tabs';
import { OrdersReceivedPage } from '../pages/waiter/orders-received/orders-received';
import { LightboxPage } from "../pages/general/lightbox/lightbox";
import { EstablishmentListPage } from "../pages/customer/establishment-list/establishment-list";
import { EstablishmentListDetailPage } from "../pages/customer/establishment-list/establishment-list-detail/establishment-list-detail";
import { MenuByEstablishmentPage } from "../pages/customer/establishment-list/menu-by-establishment/menu-by-establishment";
import { ItemCardEstablishmentComponent } from "../pages/customer/establishment-list/menu-by-establishment/item-card-establishment";
import { ItemDetailEstablishmentPage } from "../pages/customer/establishment-list/menu-by-establishment/item-detail-establishment/item-detail-establishment";
import { AdditionsEstablishmentPage } from "../pages/customer/establishment-list/additions-establishment/additions-establishment";


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
    AdditionEditPage,
    SendOrderDetailsPage,
    ItemDetailSendOrderComponent,
    GarnishSendOrderComponent,
    AdditionsSendOrderComponent,
    ChangeTablePage,
    AlphanumericCodeChangePage,
    EstablishmentExitPage,
    HomePage,
    HomeMenu,
    EstablishmentMenuPage,
    ItemCardWaiterComponent,
    ItemDetailWaiterPage,
    AdditionsWaiterPage,
    EstablishmentProfilePage,
    ModalSchedule,
    CustomerOrderConfirm,
    RewardListComponent,
    PointsPage,
    PointsDetailPage,
    OptionsPage,
    SegmentsPage,
    PopoverOptionsPage,
    OrderConfirmPage,
    TabsPage,
    OrdersReceivedPage,
    LightboxPage,
    EstablishmentListPage,
    EstablishmentListDetailPage,
    MenuByEstablishmentPage,
    ItemCardEstablishmentComponent,
    ItemDetailEstablishmentPage,
    AdditionsEstablishmentPage
];