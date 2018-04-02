import { AppComponent } from './app.component';
import { DashboardComponent } from './administrator/dashboard/dashboard.component';
import { SectionComponent } from './administrator/menu/sections/section/section.component';
import { SignupWebComponent } from './auth/signup/signup.web.component';
import { SigninWebComponent } from './auth/signin/signin.web.component';
import { CategoryComponent } from './administrator/menu/categories/categories/categories.component';
import { SubcategoryComponent } from './administrator/menu/subcategories/subcategories/subcategories.component';
import { AdditionComponent } from './administrator/menu/additions/addition/addition.component';
import { GarnishFoodComponent } from './administrator/menu/garnish-food/garnish-food/garnish-food.component';
import { OrdersComponent } from './customer/orders/order/order.component';
import { TableComponent } from './administrator/administration/tables/table/table.component';
import { EstablishmentRegisterComponent } from './administrator/administration/establishment/register/establishment-register.component';
import { SettingsWebComponent } from './settings/settings/settings.web.component';
import { ChangeEmailWebComponent } from './settings/modal-dialog/change-email/change-email.web.component';
import { ChangePasswordWebComponent } from './settings/modal-dialog/change-password/change-password.web.component';
import { EstablishmentComponent } from './administrator/administration/establishment/establishment/establishment.component';
import { GarnishFoodEditComponent } from './administrator/menu/garnish-food/garnish-food-edit/garnish-food-edit.component';
import { AdditionEditComponent } from './administrator/menu/additions/addition-edit/addition-edit.component';
import { CategoriesEditComponent } from './administrator/menu/categories/categories-edit/categories-edit.component';
import { SubcategoryEditComponent } from './administrator/menu/subcategories/subcategories-edit/subcategories-edit.component';
import { SectionEditComponent } from './administrator/menu/sections/section-edit/section-edit.component';
import { ItemCreationComponent } from './administrator/menu/items/creation/item-creation.component';
import { RecoverWebComponent } from './auth/recover-password/recover/recover.web.component';
import { ResetPasswordWebComponent } from './auth/reset-password/reset-password.web.component';
import { GoToStoreComponent } from './auth/go-to-store/go-to-store.component';
import { CollaboratorsComponent } from './administrator/administration/collaborators/collaborators/collaborators.component';
import { CollaboratorsRegisterComponent } from './administrator/administration/collaborators/register/collaborators-register.component';
import { ItemComponent } from './administrator/menu/items/item/item.component';
import { ItemEditionComponent } from './administrator/menu/items/edition/item-edition.component';
import { EstablishmentEditionComponent } from './administrator/administration/establishment/edition/establishment-edition.component';
import { IurestScheduleComponent } from './general/schedule/schedule.component';
import { CollaboratorsEditionComponent } from './administrator/administration/collaborators/edition/collaborators-edition.component';
import { EstablishmentInfoComponent } from './administrator/administration/establishment/info/establishment-info.component';
import { OrderNavigationService } from './services/navigation/order-navigation.service';
import { OrderMenuOptionComponent } from './customer/orders/order-navigation/order-menu-option.component';
import { OrderCreateComponent } from './customer/orders/order-create/order-create.component';
import { OrdersListComponent } from './customer/orders/order-list/order-list.component';
import { ItemEnableComponent } from './administrator/menu/items/enable/items-enable.component';
import { WaiterCallComponent } from './customer/waiter-call/waiter-call.component';
import { CallsComponent } from './waiter/calls/calls/calls.component';
import { CallCloseConfirmComponent } from './waiter/calls/call-close-confirm/call-close-confirm.component';
import { NotFoundWebComponent } from './auth/notfound/notfound.web.component';
import { IurestSliderComponent } from './general/slider/slider.component';
import { CreateConfirmComponent } from './administrator/administration/establishment/register/create-confirm/create-confirm.component';
import { MonthlyPaymentComponent } from './administrator/payment/monthly-payment/monthly-payment.component';
import { SupervisorDashboardComponent } from './supervisor/dashboard/supervisor-dashboard.component';
import { EstablishmentListComponent } from './administrator/administration/establishment/monthly-config/establishment-list/establishment-list.component';
import { EnableDisableComponent } from './administrator/administration/establishment/monthly-config/enable-disable/enable-disable.component';
import { DisableConfirmComponent } from './administrator/administration/establishment//monthly-config/disable-confirm/disable-confirm.component';
import { CustomerOrderConfirmComponent } from './waiter/calls/customer-order-confirm/customer-order-confirm.component';
import { PayuPaymentFormComponent } from './administrator/payment/payu-payment-form/payu-payment-form.component';
import { PaymentHistoryComponent } from './administrator/payment/payment-history/payment-history.component';
import { ReactivateEstablishmentComponent } from './administrator/payment/reactivate-establishment/reactivate-establishment.component';
import { CcPaymentConfirmComponent } from './administrator/payment/payu-payment-form/cc-payment-confirm/cc-payment-confirm.component';
import { TrnResponseConfirmComponent } from './administrator/payment/payu-payment-form/transaction-response-confirm/trn-response-confirm.component';
import { VerifyResultComponent } from './administrator/payment/payment-history/verify-result/verify-result.component';
import { AdminSignupComponent } from './auth/admin-signup/admin-signup.component';
import { AlertConfirmComponent } from './general/alert-confirm/alert-confirm.component';
import { UserLanguageService } from './services/general/user-language.service';
import { ItemEnableSupComponent } from './supervisor/items-enable/items-enable-sup.component';
import { EnableConfirmComponent } from './administrator/menu/items/enable/enable-confirm/enable-confirm.component';
import { MenuListComponent } from './waiter/menu-list/menu-list.component';
import { SupervisorCollaboratorsComponent } from './supervisor/collaborators/collaborators/supervisor-collaborators.component';
import { SupervisorCollaboratorsEditionComponent } from './supervisor/collaborators/edition/supervisor-collaborators-edition.component';
import { SupervisorCollaboratorsRegisterComponent } from './supervisor/collaborators/register/supervisor-collaborators-register.component';
import { SupervisorTableComponent } from './supervisor/tables/supervisor-tables.component';
import { RecoverConfirmComponent } from './auth/recover-password/recover-confirm/recover-confirm.component';
import { TableChangeComponent } from './customer/table-change/table-change.component';
import { EstablishmentExitComponent } from './customer/establishment-exit/establishment-exit.component';
import { EstablishmentTableControlComponent } from './administrator/administration/tables/table-control/establishment-table-control.component';
import { TableDetailComponent } from './administrator/administration/tables/table-control/table-detail/table-detail.component';
import { PenalizeCustomerComponent } from './administrator/administration/tables/table-control/table-detail/penalize-customer/penalize-customer.component';
import { SupervisorEstablishmentTableControlComponent } from './supervisor/establishment-table-control/supervisor-establishment-table-control.component';
import { EstablishmentProfileComponent } from './administrator/administration/establishment/profile/establishment-profile.component';
import { EstablishmentProFileDetailComponent } from './customer/establishment-profile-detail/establishment-profile-detail/establishment-profile-detail.component';
import { ScheduleDetailComponent } from './customer/establishment-profile-detail/schedule-detail/schedule-detail.component';
import { PaymentPlanInfo } from './auth/payment-plan-info/payment-plan-info.component';
import { ImageService } from './services/general/image.service';
import { PayuPaymentService } from './services/payment/payu-payment.service';
import { Recommended } from './administrator/menu/items/item/recommended/recommended.component';
import { RewardComponent } from './administrator/rewards/reward/reward.component';
import { RewardEditComponent } from './administrator/rewards/reward-edit/reward-edit.component';
import { RewardsDetailComponent } from './customer/rewards-detail/rewards-detail.component';
import { AfterEstablishmentCreationComponent } from './administrator/administration/establishment/register/after-establishment-creation/after-establishment-creation.component';
import { LightBoxComponent } from './general/lightbox/lightbox.component';
import { CustomerPointsComponent } from './customer/points/points/customer-points.component';
import { PointsDetailComponent } from './customer/points/points-detail/points-detail.component';
import { ItemUnitsChartComponent } from './administrator/dashboard/item-units-chart/item-units-chart.component';
import { RewardUnitsChartComponent } from './administrator/dashboard/reward-units-chart/reward-units-chart.component';
import { ItemHistoryChartComponent } from './administrator/dashboard/item-history-chart/item-history-chart.component';
import { OptionsComponent } from './administrator/menu/options/options/option/option.component';
import { OptionEditComponent } from './administrator/menu/options/options/option-edit/option-edit.component';
import { OptionValueComponent } from './administrator/menu/options/values/option-value/option-value.component';
import { OptionValueEditComponent } from './administrator/menu/options/values/option-value-edit/option-value-edit.component';
import { RewardHistoryChartComponent } from './administrator/dashboard/reward-history-chart/reward-history-chart.component';
import { OrdersTodayComponent } from "./administrator/orders-today/orders-today.component";
import { CashierOrdersTodayComponent } from "./cashier/cashier-orders-today.component";
import { BagsPaymentComponent } from './administrator/payment/bags-payment/bags-payment.component';

export const WEB_DECLARATIONS = [
    AppComponent,
    DashboardComponent,
    SigninWebComponent,
    SignupWebComponent,
    ResetPasswordWebComponent,
    SectionComponent,
    CategoryComponent,
    SubcategoryComponent,
    AdditionComponent,
    GarnishFoodComponent,
    ItemComponent,
    ItemEditionComponent,
    ItemCreationComponent,
    EstablishmentComponent,
    EstablishmentRegisterComponent,
    EstablishmentEditionComponent,
    EstablishmentInfoComponent,
    IurestScheduleComponent,
    TableComponent,
    OrdersComponent,
    SettingsWebComponent,
    CollaboratorsComponent,
    CollaboratorsRegisterComponent,
    GoToStoreComponent,
    OrderMenuOptionComponent,
    OrderCreateComponent,
    OrdersListComponent,
    ItemEnableComponent,
    WaiterCallComponent,
    CallsComponent,
    NotFoundWebComponent,
    IurestSliderComponent,
    MonthlyPaymentComponent,
    SupervisorDashboardComponent,
    EstablishmentListComponent,
    EnableDisableComponent,
    PayuPaymentFormComponent,
    PaymentHistoryComponent,
    ReactivateEstablishmentComponent,
    AdminSignupComponent,
    ItemEnableSupComponent,
    MenuListComponent,
    SupervisorCollaboratorsComponent,
    SupervisorCollaboratorsRegisterComponent,
    SupervisorTableComponent,
    TableChangeComponent,
    EstablishmentExitComponent,
    EstablishmentTableControlComponent,
    TableDetailComponent,
    SupervisorEstablishmentTableControlComponent,
    EstablishmentProfileComponent,
    EstablishmentProFileDetailComponent,
    RewardComponent,
    CustomerPointsComponent,
    PointsDetailComponent,
    ItemUnitsChartComponent,
    RewardUnitsChartComponent,
    ItemHistoryChartComponent,
    RewardHistoryChartComponent,
    OrdersTodayComponent,
    OptionsComponent,
    OptionValueComponent,
    RewardHistoryChartComponent,
    CashierOrdersTodayComponent,
    BagsPaymentComponent
];

export const MODAL_DIALOG_DECLARATIONS = [
    SectionEditComponent,
    ChangeEmailWebComponent,
    ChangePasswordWebComponent,
    GarnishFoodEditComponent,
    AdditionEditComponent,
    CategoriesEditComponent,
    SubcategoryEditComponent,
    RecoverWebComponent,
    CallCloseConfirmComponent,
    CreateConfirmComponent,
    CollaboratorsEditionComponent,
    DisableConfirmComponent,
    CustomerOrderConfirmComponent,
    CcPaymentConfirmComponent,
    TrnResponseConfirmComponent,
    VerifyResultComponent,
    AlertConfirmComponent,
    EnableConfirmComponent,
    SupervisorCollaboratorsEditionComponent,
    RecoverConfirmComponent,
    PenalizeCustomerComponent,
    ScheduleDetailComponent,
    PaymentPlanInfo,
    Recommended,
    RewardEditComponent,
    RewardsDetailComponent,
    AfterEstablishmentCreationComponent,
    LightBoxComponent,
    OptionEditComponent,
    OptionValueEditComponent
];

export const SERVICES_DECLARATIONS = [
    OrderNavigationService,
    UserLanguageService,
    ImageService,
    PayuPaymentService
];