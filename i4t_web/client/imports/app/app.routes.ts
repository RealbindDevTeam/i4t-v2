import { Route } from '@angular/router';
import { LayoutComponent } from './web/navigation/layout/layout.component';
import { RouteGuard } from './web/services/navigation/route-guard.service';
import { CustomerGuard } from './web/services/navigation/customer-guard.service';
import { AdminGuard } from './web/services/navigation/admin-guard.service';
import { WaiterGuard } from './web/services/navigation/waiter-guard.service';
import { SupervisorGuard } from './web/services/navigation/supervisor-guard.service';
import { CashierGuard } from './web/services/navigation/cashier-guard.service';
import { DashboardComponent } from './web/administrator/dashboard/dashboard.component';
import { SectionComponent } from './web/administrator/menu/sections/section/section.component';
//import { SignupWebComponent } from './web/auth/signup/signup.web.component';
import { SigninWebComponent } from './web/auth/signin/signin.web.component';
import { CategoryComponent } from './web/administrator/menu/categories/categories/categories.component';
import { SubcategoryComponent } from './web/administrator/menu/subcategories/subcategories/subcategories.component';
import { AdditionComponent } from './web/administrator/menu/additions/addition/addition.component';
import { GarnishFoodComponent } from './web/administrator/menu/garnish-food/garnish-food/garnish-food.component';
import { OrdersComponent } from './web/customer/orders/order/order.component';
import { TableComponent } from './web/administrator/administration/tables/table/table.component';
import { EstablishmentRegisterComponent } from './web/administrator/administration/establishment/register/establishment-register.component';
import { SettingsWebComponent } from './web/settings/settings/settings.web.component';
import { EstablishmentComponent } from './web/administrator/administration/establishment/establishment/establishment.component';
import { ItemCreationComponent } from './web/administrator/menu/items/creation/item-creation.component';
import { ItemEditionComponent } from './web/administrator/menu/items/edition/item-edition.component';
import { ResetPasswordWebComponent } from './web/auth/reset-password/reset-password.web.component';
import { GoToStoreComponent } from './web/auth/go-to-store/go-to-store.component';
import { CollaboratorsComponent } from './web/administrator/administration/collaborators/collaborators/collaborators.component';
import { CollaboratorsRegisterComponent } from './web/administrator/administration/collaborators/register/collaborators-register.component';
import { ItemComponent } from './web/administrator/menu/items/item/item.component';
import { EstablishmentEditionComponent } from './web/administrator/administration/establishment/edition/establishment-edition.component';
import { ItemEnableComponent } from './web/administrator/menu/items/enable/items-enable.component';
import { WaiterCallComponent } from './web/customer/waiter-call/waiter-call.component';
import { CallsComponent } from './web/waiter/calls/calls/calls.component';
import { NotFoundWebComponent } from './web/auth/notfound/notfound.web.component';
import { MonthlyPaymentComponent } from './web/administrator/payment/monthly-payment/monthly-payment.component';
import { SupervisorDashboardComponent } from './web/supervisor/dashboard/supervisor-dashboard.component';
import { PayuPaymentFormComponent } from './web/administrator/payment/payu-payment-form/payu-payment-form.component';
import { PaymentHistoryComponent } from './web/administrator/payment/payment-history/payment-history.component';
import { ReactivateEstablishmentComponent } from './web/administrator/payment/reactivate-establishment/reactivate-establishment.component';
import { TrnResponseConfirmComponent } from './web/administrator/payment/payu-payment-form/transaction-response-confirm/trn-response-confirm.component';
import { AdminSignupComponent } from './web/auth/admin-signup/admin-signup.component';
import { ItemEnableSupComponent } from './web/supervisor/items-enable/items-enable-sup.component';
import { MenuListComponent } from './web/waiter/menu-list/menu-list.component';
import { SupervisorCollaboratorsComponent } from './web/supervisor/collaborators/collaborators/supervisor-collaborators.component';
import { SupervisorCollaboratorsRegisterComponent } from './web/supervisor/collaborators/register/supervisor-collaborators-register.component';
import { SupervisorTableComponent } from './web/supervisor/tables/supervisor-tables.component';
import { TableChangeComponent } from './web/customer/table-change/table-change.component';
import { EstablishmentExitComponent } from './web/customer/establishment-exit/establishment-exit.component';
import { EstablishmentTableControlComponent } from './web/administrator/administration/tables/table-control/establishment-table-control.component';
import { TableDetailComponent } from './web/administrator/administration/tables/table-control/table-detail/table-detail.component';
import { SupervisorEstablishmentTableControlComponent } from './web/supervisor/establishment-table-control/supervisor-establishment-table-control.component';
import { EstablishmentProfileComponent } from './web/administrator/administration/establishment/profile/establishment-profile.component';
import { EstablishmentProFileDetailComponent } from './web/customer/establishment-profile-detail/establishment-profile-detail/establishment-profile-detail.component';
import { RewardComponent } from './web/administrator/rewards/reward/reward.component';
import { CustomerPointsComponent } from './web/customer/points/points/customer-points.component';
import { PointsDetailComponent } from './web/customer/points/points-detail/points-detail.component';
import { ItemUnitsChartComponent } from './web/administrator/dashboard/item-units-chart/item-units-chart.component';
import { RewardUnitsChartComponent } from 'client/imports/app/web/administrator/dashboard/reward-units-chart/reward-units-chart.component';
import { ItemHistoryChartComponent } from './web/administrator/dashboard/item-history-chart/item-history-chart.component';
import { OptionsComponent } from './web/administrator/menu/options/options/option/option.component';
import { OptionValueComponent } from './web/administrator/menu/options/values/option-value/option-value.component';
import { RewardHistoryChartComponent } from './web/administrator/dashboard/reward-history-chart/reward-history-chart.component';
import { OrdersTodayComponent } from "./web/administrator/orders-today/orders-today.component";
import { CashierOrdersTodayComponent } from "./web/cashier/cashier-orders-today.component";
import { EstablishmentListComponent } from './web/administrator/administration/establishment/monthly-config/establishment-list/establishment-list.component';
import { EnableDisableComponent } from './web/administrator/administration/establishment/monthly-config/enable-disable/enable-disable.component';
import { BagsPaymentComponent } from './web/administrator/payment/bags-payment/bags-payment.component';

export const routes: Route[] = [
    {
        path: 'app', component: LayoutComponent, canActivateChild: [RouteGuard], children: [
            { path: 'dashboard', component: DashboardComponent, canActivate: [AdminGuard] },
            { path: 'settings', component: SettingsWebComponent },
            { path: 'collaborators', component: CollaboratorsComponent, canActivate: [SupervisorGuard] },
            { path: 'collaborators-register', component: CollaboratorsRegisterComponent, canActivate: [SupervisorGuard] },
            { path: 'sections', component: SectionComponent, canActivate: [AdminGuard] },
            { path: 'categories', component: CategoryComponent, canActivate: [AdminGuard] },
            { path: 'subcategories', component: SubcategoryComponent, canActivate: [AdminGuard] },
            { path: 'additions', component: AdditionComponent, canActivate: [AdminGuard] },
            { path: 'garnishFood', component: GarnishFoodComponent, canActivate: [AdminGuard] },
            { path: 'items', component: ItemComponent, canActivate: [AdminGuard] },
            { path: 'items-creation', component: ItemCreationComponent, canActivate: [AdminGuard] },
            { path: 'items-edition/:param1', component: ItemEditionComponent, canActivate: [AdminGuard] },
            { path: 'establishment', component: EstablishmentComponent, canActivate: [AdminGuard] },
            { path: 'establishment-register', component: EstablishmentRegisterComponent, canActivate: [AdminGuard] },
            { path: 'establishment-edition/:param1', component: EstablishmentEditionComponent, canActivate: [AdminGuard] },
            { path: 'tables', component: TableComponent, canActivate: [AdminGuard] },
            { path: 'orders', component: OrdersComponent, canActivate: [CustomerGuard] },
            { path: 'items-enable', component: ItemEnableComponent, canActivate: [SupervisorGuard] },
            { path: 'waiter-call', component: WaiterCallComponent, canActivate: [CustomerGuard] },
            { path: 'calls', component: CallsComponent, canActivate: [WaiterGuard] },
            { path: 'monthly-payment', component: MonthlyPaymentComponent, canActivate: [AdminGuard] },
            { path: 'dashboards', component: SupervisorDashboardComponent, canActivate: [SupervisorGuard] },
            { path: 'establishment-list', component: EstablishmentListComponent, canActivate: [AdminGuard] },
            { path: 'enable-disable/:param1', component: EnableDisableComponent, canActivate: [AdminGuard] },
            { path: 'payment-form/:param1/:param2/:param3', component: PayuPaymentFormComponent, canActivate: [AdminGuard] },
            { path: 'payment-history', component: PaymentHistoryComponent, canActivate: [AdminGuard] },
            { path: 'reactivate-establishment', component: ReactivateEstablishmentComponent, canActivate: [AdminGuard] },
            { path: 'items-enable-sup', component: ItemEnableSupComponent, canActivate: [SupervisorGuard] },
            { path: 'menu-list', component: MenuListComponent },
            { path: 'supervisor-collaborators', component: SupervisorCollaboratorsComponent, canActivate: [SupervisorGuard] },
            { path: 'supervisor-collaborators-register', component: SupervisorCollaboratorsRegisterComponent, canActivate: [SupervisorGuard] },
            { path: 'supervisor-tables', component: SupervisorTableComponent, canActivate: [SupervisorGuard] },
            { path: 'table-change', component: TableChangeComponent, canActivate: [CustomerGuard] },
            { path: 'establishment-exit', component: EstablishmentExitComponent, canActivate: [CustomerGuard] },
            { path: 'establishment-table-control', component: EstablishmentTableControlComponent, canActivate: [AdminGuard] },
            { path: 'table-detail/:param1/:param2/:param3/:param4/:param5', component: TableDetailComponent, canActivate: [SupervisorGuard] },
            { path: 'supervisor-establishment-table-control', component: SupervisorEstablishmentTableControlComponent, canActivate: [SupervisorGuard] },
            { path: 'establishment-profile', component: EstablishmentProfileComponent, canActivate: [AdminGuard] },
            { path: 'establishment-detail', component: EstablishmentProFileDetailComponent },
            { path: 'establishment-detail/:param1', component: EstablishmentProFileDetailComponent },
            { path: 'rewards', component: RewardComponent, canActivate: [AdminGuard] },
            { path: 'points', component: CustomerPointsComponent, canActivate: [CustomerGuard] },
            { path: 'establishment-points', component: PointsDetailComponent, canActivate: [CustomerGuard] },
            { path: 'establishment-points/:param1', component: PointsDetailComponent, canActivate: [CustomerGuard] },
            { path: 'item-units-chart/:param1', component: ItemUnitsChartComponent, canActivate: [AdminGuard] },
            { path: 'reward-units-chart/:param1', component: RewardUnitsChartComponent, canActivate: [AdminGuard] },
            { path: 'item-history-chart/:param1', component: ItemHistoryChartComponent, canActivate: [AdminGuard] },
            { path: 'reward-history-chart/:param1', component: RewardHistoryChartComponent, canActivate: [AdminGuard] },
            { path: 'orders-today', component: OrdersTodayComponent, canActivate: [AdminGuard] },
            { path: 'options', component: OptionsComponent, canActivate: [AdminGuard] },
            { path: 'option-values', component: OptionValueComponent, canActivate: [AdminGuard] },
            { path: 'reward-history-chart/:param1', component: RewardHistoryChartComponent, canActivate: [AdminGuard] },
            { path: 'cashier-orders-today', component: CashierOrdersTodayComponent, canActivate: [CashierGuard] },
            { path: 'bags-payment', component: BagsPaymentComponent, canActivate: [AdminGuard] }
        ]
    },
    { path: '', component: SigninWebComponent },
    //{ path: 'signup', component: SignupWebComponent },
    { path: 'admin-signup', component: AdminSignupComponent },
    { path: 'reset-password/:tk', component: ResetPasswordWebComponent },
    { path: 'go-to-store/:ic', component: GoToStoreComponent },
    { path: '404', component: NotFoundWebComponent },
    { path: '**', redirectTo: '/404' }
];
