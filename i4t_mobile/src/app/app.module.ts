import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { GoogleMaps } from '@ionic-native/google-maps';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Network } from '@ionic-native/network';
import { IonicStorageModule } from '@ionic/storage';
import { MomentModule } from 'angular2-moment';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { MyApp } from './app.component';
import { PAGES_DECLARATIONS } from './index';

import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Facebook } from '@ionic-native/facebook';
import { Device } from '@ionic-native/device';
import { UserLanguageServiceProvider } from '../providers/user-language-service/user-language-service';
import { NetworkDetectionServiceProvider } from '../providers/network-detection-service/network-detection-service';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MyApp,
    ...PAGES_DECLARATIONS
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {
      platforms: {
        android: {
          tabsPlacement: 'top',
          tabsHideOnSubPages: true
        },
        ios: {
          tabsPlacement: 'bottom',
          tabsHideOnSubPages: true,
          backButtonText: ''
        }
      }
    }),
    IonicStorageModule.forRoot(),
    MomentModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    ...PAGES_DECLARATIONS
  ],
  providers: [
    StatusBar,
    SplashScreen,
    BarcodeScanner,
    Facebook,
    Device,
    UserLanguageServiceProvider,
    GoogleMaps,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    InAppBrowser,
    Network,
    NetworkDetectionServiceProvider
  ]
})
export class AppModule { }
