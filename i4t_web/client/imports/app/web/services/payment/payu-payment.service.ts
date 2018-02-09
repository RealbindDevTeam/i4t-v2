import { Injectable, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CcRequestColombia } from '../../../../../../both/models/payment/cc-request-colombia.model';
import { Parameters } from '../../../../../../both/collections/general/parameter.collection';

@Injectable()
export class PayuPaymentService {

    private _al: string = Meteor.settings.public.custpayinfo.al;
    private _ak: string = Meteor.settings.public.custpayinfo.ak;
    private _mi: string = Meteor.settings.public.custpayinfo.mi;
    private _ai: number = Meteor.settings.public.custpayinfo.ai;

    private payuReportsApiURI: string;

    private _parameterSub: Subscription;

    private headers = new HttpHeaders({
        //'Host': 'sandbox.api.payulatam.com',
        'Content-Type': 'application/json;charset=utf-8',
        'Accept': 'application/json'
        //'Accept-language': 'es',
        //'Content-Length': 'length',
    });

    constructor(private http: HttpClient, private _ngZone: NgZone) {

    }

    /**
     * This function sends the autorization and capture JSON to PayU platform
     * @param {CcRequestColombia} requestObject
     * @return {Observable}
     */
    authorizeAndCapture(url: string, requestObject: CcRequestColombia): Observable<any> {
        return this.http
            .post(url, JSON.stringify(requestObject), { headers: this.headers })
            .map(response => response)
            .catch(this.handleError);
    }

    /**
     * This functions queries the given transaction report of PayU platform
     * @param {Object} requestObject
     */
    getTransactionResponse(url: string, requestObject: any): Observable<any> {
        return this.http
            .post(url, JSON.stringify(requestObject), { headers: this.headers })
            .map(response => response)
            .catch(this.handleError);
    }

    /**
     * This function verify conectivity with Payu platform reports API 
     * @param  {any} obj
     * @return {Observable}
     */
    getReportsPing(obj: any): Observable<any> {
        return this.http
            .post(this.payuReportsApiURI, JSON.stringify(obj), { headers: this.headers })
            .map(response => response)
            .catch(this.handleError);
    }

    /**
     * This function verify conectivity with Payu platform payments API 
     * @param  {any} obj
     * @return {Observable}
     */
    getPaymentsPing(obj: any): Observable<any> {
        return this.http
            .post(this.payuReportsApiURI, JSON.stringify(obj), { headers: this.headers })
            .map(response => response)
            .catch(this.handleError);
    }

    /**
     * This function gets client public ip
     * @return {Observable<any>}
     */
    getPublicIp(url: string) {
        return this.http.get(url).map(response => response).catch(this.handleError);
    }

    get al(): string {
        return this._al;
    }

    get ak(): string {
        return this._ak;
    }

    get mi(): string {
        return this._mi;
    }

    get ai(): number {
        return this._ai;
    }


    /**
     * This function emits the error generated in http request
     * @return {Observable<any>}
     */
    private handleError(error: any): Observable<any> {
        return Observable.throw(error.message || error);
    }
}