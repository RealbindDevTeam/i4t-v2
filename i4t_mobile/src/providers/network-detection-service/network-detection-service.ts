import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network';

/*
  Generated class for the NetworkDetectionServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class NetworkDetectionServiceProvider {

  onDevice: boolean;

  constructor(private network: Network) {

  }

  isOnline() {

  }

}
