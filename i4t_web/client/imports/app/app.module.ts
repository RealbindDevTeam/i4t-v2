import { NgModule, ModuleWithProviders } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatGridListModule, MatSnackBarModule, MatDatepickerModule, MatNativeDateModule, MatDialogModule, MatSidenavModule, MatListModule, MatCardModule, MatButtonModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatTabsModule, MatCheckboxModule, MatSliderModule, MatProgressSpinnerModule, MatTooltipModule, MatIconModule, MatToolbarModule, MatMenuModule, MatButtonToggleModule, MatRadioModule, MatExpansionModule, MatStepperModule, MatChipsModule, MatTableModule } from '@angular/material';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AgmCoreModule } from '@agm/core';
import { NgxPageScrollModule } from 'ngx-page-scroll';
import { ChartModule } from 'angular-highcharts';

import { routes } from './app.routes';
import { AppComponent } from './web/app.component';
import { WEB_DECLARATIONS, MODAL_DIALOG_DECLARATIONS, SERVICES_DECLARATIONS } from './web/index';

import { NavigationModule } from './web/navigation/navigation.module';

import { RouteGuard } from './web/services/navigation/route-guard.service';
import { CustomerGuard } from './web/services/navigation/customer-guard.service';
import { AdminGuard } from './web/services/navigation/admin-guard.service';
import { WaiterGuard } from './web/services/navigation/waiter-guard.service';
import { SupervisorGuard } from './web/services/navigation/supervisor-guard.service';
import { CashierGuard } from './web/services/navigation/cashier-guard.service';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, '/i18n/', '.json');
}

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
    FlexLayoutModule,
    NavigationModule.forRoot(),
    HttpClientModule,
    BrowserAnimationsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
    NgxPageScrollModule,
    BrowserAnimationsModule,
    MatGridListModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatRadioModule,
    MatExpansionModule,
    MatStepperModule,
    MatChipsModule,
    MatTableModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyCFXGTI9kCa4U7YyMd2USL9LCV_JlQinyw'
    }),
    ChartModule
  ],
  declarations: [
    ...WEB_DECLARATIONS,
    ...MODAL_DIALOG_DECLARATIONS
  ],
  providers: [
    RouteGuard,
    CustomerGuard,
    AdminGuard,
    WaiterGuard,
    SupervisorGuard,
    CashierGuard
  ],
  bootstrap: [
    AppComponent
  ],
  entryComponents: [
    AppComponent,
    ...MODAL_DIALOG_DECLARATIONS
  ]
})
export class AppModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: AppModule,
      providers: [SERVICES_DECLARATIONS]
    };
  }
}