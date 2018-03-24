import { Meteor } from 'meteor/meteor';
import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { CustomValidators } from '../../../../../../../both/shared-components/validators/custom-validator';
import { CcPaymentConfirmComponent } from './cc-payment-confirm/cc-payment-confirm.component';
import { TrnResponseConfirmComponent } from './transaction-response-confirm/trn-response-confirm.component';
import { CcPaymentMethods } from '../../../../../../../both/collections/payment/cc-payment-methods.collection';
import { CcPaymentMethod } from '../../../../../../../both/models/payment/cc-payment-method.model';
import { Countries } from '../../../../../../../both/collections/general/country.collection';
import { Country } from '../../../../../../../both/models/general/country.model';
import { City } from '../../../../../../../both/models/general/city.model';
import { Cities } from '../../../../../../../both/collections/general/city.collection';
import { PaymentTransaction } from '../../../../../../../both/models/payment/payment-transaction.model';
import { PaymentTransactions } from '../../../../../../../both/collections/payment/payment-transaction.collection';
import { Parameter } from '../../../../../../../both/models/general/parameter.model';
import { Parameters } from '../../../../../../../both/collections/general/parameter.collection';
import { PaymentHistory } from '../../../../../../../both/models/payment/payment-history.model';
import { PaymentsHistory } from '../../../../../../../both/collections/payment/payment-history.collection';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { Table } from '../../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../../both/collections/establishment/table.collection';
import { CcRequestColombia, Merchant, Transaction, Order, Payer, TX_VALUE, TX_TAX, TX_TAX_RETURN_BASE, CreditCard, ExtraParameters, AdditionalValues, Buyer, ShippingBillingAddress } from '../../../../../../../both/models/payment/cc-request-colombia.model';
import { AlertConfirmComponent } from '../../../../web/general/alert-confirm/alert-confirm.component';
import { UserDetail } from '../../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../../both/collections/auth/user-detail.collection';
import { InvoicesInfo } from '../../../../../../../both/collections/payment/invoices-info.collection';
import { IurestInvoices } from '../../../../../../../both/collections/payment/iurest-invoices.collection';
import { CompanyInfo, ClientInfo } from '../../../../../../../both/models/payment/iurest-invoice.model';
import { PayuPaymentService } from '../../../services/payment/payu-payment.service';

let md5 = require('md5');

@Component({
    selector: 'payu-payment-form',
    templateUrl: './payu-payment-form.component.html',
    styleUrls: ['./payu-payment-form.component.scss']
})
export class PayuPaymentFormComponent implements OnInit, OnDestroy {

    private _paymentForm: FormGroup = new FormGroup({});
    private _selectedPaymentMethod: string;
    private _selectedCardMonth: string;
    private _selectedCardYear: string;
    private _selectedCountry: Country;
    private _selectedCity: string = "";
    private _selectedAddress: string;
    private _selectedPhone: string;
    private _selectedDniNumber: string;

    private _cCPaymentMethodSub: Subscription;
    private _countrySub: Subscription;
    private _citySub: Subscription;
    private _paymentTransactionSub: Subscription;
    private _parameterSub: Subscription;
    private _establishmentSub: Subscription;
    private _userDetailSub: Subscription;
    private _invoiceInfoSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _cCPaymentMethods: Observable<CcPaymentMethod[]>;
    private _countries: Observable<Country[]>;
    private _cities: Observable<City[]>;
    private _paymentTransactions: Observable<PaymentTransaction[]>;
    private _parameters: Observable<Parameter[]>;
    private _historyPayments: Observable<PaymentHistory[]>;

    private _establishmentsIdsArray: string[];
    private _establishmentsNamesArray: string[];
    private _currentDate: Date;
    private _currentYear: number;
    private _yearsArray: any[];
    private _monthsArray: any[];
    private _paymentLogoName: string = "";
    private _deviceSessionId: string;
    private _mdDialogRef: MatDialogRef<any>;
    private _mdDialogRef2: MatDialogRef<any>;
    private _countryName: string;
    private _ccMethodPayment: string;
    private _session_id: string;
    private _timestamp: string;
    private _ipAddress: string = "";
    private _userAgent: string;
    private _sessionUserId: string;
    private _loading: boolean;
    private _firstMonthDay: Date;
    private _lastMonthDay: Date;

    private _valueToPay: number;
    private _currency: string;
    private _mode: string;
    private post: any;
    private scriptOneSanitized: any;
    private scriptTwoSanitized: any;
    private scriptThreeSanitized: any;
    private scriptFourSanitized: any;

    private is_prod_flag: string;
    private isProd: boolean;

    private titleMsg: string;
    private btnAcceptLbl: string;

    /**
     * PayuPaymentFormComponent Constructor
     * @param {Router} _router 
     * @param {ActivatedRoute} _activateRoute 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {PayuPaymenteService} _payuPaymentService 
     * @param {NgZone} _ngZone 
     * @param {MatDialog} _mdDialog 
     * @param {DomSanitizer} _domSanitizer 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private _router: Router,
        private _activateRoute: ActivatedRoute,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _payuPaymentService: PayuPaymentService,
        private _ngZone: NgZone,
        public _mdDialog: MatDialog,
        private _domSanitizer: DomSanitizer,
        private _userLanguageService: UserLanguageService) {

        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');

        this._currentDate = new Date();

        this._session_id = localStorage.getItem('Meteor.loginToken');
        this._timestamp = this._currentDate.getTime().toString();
        this._deviceSessionId = md5(this._session_id + this._timestamp);
        this._sessionUserId = this._deviceSessionId + Meteor.userId();
        this._firstMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth(), 1);
        this._lastMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth() + 1, 0);

        this._activateRoute.params.forEach((params: Params) => {
            this._valueToPay = params['param1'];
            this._currency = params['param2'];
            this._mode = params['param3'];
        });

        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        let _scriptOne: string;
        let _scriptTwo: string;
        let _scriptThree: string;
        let _scriptFour: string;

        this.removeSubscriptions();
        this._paymentForm = new FormGroup({
            paymentMethod: new FormControl('', [Validators.required]),
            fullName: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(150)]),
            cardNumber: new FormControl('', [Validators.required, Validators.minLength(13), Validators.maxLength(20), CustomValidators.numericValidator]),
            expirationMonth: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]),
            expirationYear: new FormControl('', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]),
            securityCode: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(4), CustomValidators.numericValidator]),
            firstName: new FormControl({ value: Meteor.user().profile.first_name, disabled: true }, [Validators.required, Validators.minLength(1), Validators.maxLength(70)]),
            lastName: new FormControl({ value: Meteor.user().profile.last_name, disabled: true }, [Validators.required, Validators.minLength(1), Validators.maxLength(70)]),
            email: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(255), CustomValidators.emailValidator]),
            dniNumber: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(20)]),
            country: new FormControl('', [Validators.required]),
            city: new FormControl('', [Validators.required]),
            streetOne: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]),
            contactPhone: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(20)])
        });

        this._cCPaymentMethodSub = MeteorObservable.subscribe('getCcPaymentMethods').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._cCPaymentMethods = CcPaymentMethods.find({}).zone();
            });
        });

        this._paymentTransactionSub = MeteorObservable.subscribe('getTransactions').takeUntil(this._ngUnsubscribe).subscribe();
        this._parameterSub = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                _scriptOne = Parameters.findOne({ name: 'payu_script_p_tag' }).value;
                _scriptTwo = Parameters.findOne({ name: 'payu_script_img_tag' }).value;
                _scriptThree = Parameters.findOne({ name: 'payu_script_script_tag' }).value;
                _scriptFour = Parameters.findOne({ name: 'payu_script_object_tag' }).value;
                this.is_prod_flag = Parameters.findOne({ name: 'payu_is_prod' }).value;
                this.isProd = (this.is_prod_flag == 'true');

                this.scriptOneSanitized = this._domSanitizer.bypassSecurityTrustStyle(_scriptOne + this._sessionUserId + ')');
                this.scriptTwoSanitized = this._domSanitizer.bypassSecurityTrustUrl(_scriptTwo + this._sessionUserId);
                this.scriptThreeSanitized = this._domSanitizer.bypassSecurityTrustResourceUrl(_scriptThree + this._sessionUserId);
                this.scriptFourSanitized = this._domSanitizer.bypassSecurityTrustResourceUrl(_scriptFour + this._sessionUserId);

                let ipPublicUrl = Parameters.findOne({ name: 'ip_public_service_url' }).value;
                let ipPublicUrl2 = Parameters.findOne({ name: 'ip_public_service_url2' }).value;
                let ipPublicUrl3 = Parameters.findOne({ name: 'ip_public_service_url3' }).value;

                this._payuPaymentService.getPublicIp(ipPublicUrl).subscribe(
                    ipPublic => {
                        this._ipAddress = ipPublic.ip;
                    },
                    error => {
                        this._payuPaymentService.getPublicIp(ipPublicUrl2).subscribe(
                            ipPublic2 => {
                                this._ipAddress = ipPublic2.ip;
                            },
                            error => {
                                this._payuPaymentService.getPublicIp(ipPublicUrl3).subscribe(
                                    ipPublic3 => {
                                        this._ipAddress = ipPublic3.ip;
                                    },
                                    error => {
                                        let errorMsg = this.itemNameTraduction('PAYU_PAYMENT_FORM.UNAVAILABLE_PAYMENT');
                                        this.openDialog(this.titleMsg, '', errorMsg, '', this.btnAcceptLbl, false);
                                        this._loading = false;
                                        this._router.navigate(['/app/monthly-payment']);
                                    }
                                );
                            }
                        );
                    }
                );
            });
        });
        this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let auxUsrDetail = UserDetails.findOne({ user_id: Meteor.userId() });
                this._paymentForm.get('dniNumber').setValue(auxUsrDetail.dni_number);
                this._paymentForm.get('dniNumber').disable();
                this._paymentForm.get('streetOne').setValue(auxUsrDetail.address);
                this._paymentForm.get('streetOne').disable();
                this._paymentForm.get('contactPhone').setValue(auxUsrDetail.contact_phone);
                this._paymentForm.get('contactPhone').disable();

                let auxEmail: string = Meteor.user().emails[0].address;
                this._paymentForm.get('email').setValue(auxEmail);
                this._paymentForm.get('email').disable();

                this._selectedAddress = auxUsrDetail.address;
                this._selectedPhone = auxUsrDetail.contact_phone;
                this._selectedDniNumber = auxUsrDetail.dni_number;

                this._countrySub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        let auxCountry = Countries.findOne({ _id: auxUsrDetail.country_id });
                        this._paymentForm.get('country').setValue(this.itemNameTraduction(auxCountry.name));
                        this._paymentForm.get('country').disable();
                        this._selectedCountry = auxCountry;
                        this._invoiceInfoSub = MeteorObservable.subscribe('getInvoicesInfoByCountry', auxCountry._id).takeUntil(this._ngUnsubscribe).subscribe();
                    });
                });

                this._citySub = MeteorObservable.subscribe('cities').takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        if (auxUsrDetail.city_id !== '') {
                            let auxCity = Cities.findOne({ _id: auxUsrDetail.city_id });
                            this._paymentForm.get('city').setValue(auxCity.name);
                            this._paymentForm.get('city').disable();
                            this._selectedCity = auxCity.name;
                        } else {
                            this._paymentForm.get('city').setValue(auxUsrDetail.other_city);
                            this._paymentForm.get('city').disable();
                            this._selectedCity = auxUsrDetail.other_city;
                        }
                    });
                });
            });
        });

        if (this._mode === 'normal') {
            this._establishmentSub = MeteorObservable.subscribe('currentEstablishmentsNoPayed', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        } else {
            this._establishmentSub = MeteorObservable.subscribe('getInactiveEstablishments', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        }

        this._monthsArray = [{ value: '01', viewValue: '01' }, { value: '02', viewValue: '02' }, { value: '03', viewValue: '03' },
        { value: '04', viewValue: '04' }, { value: '05', viewValue: '05' }, { value: '06', viewValue: '06' },
        { value: '07', viewValue: '07' }, { value: '08', viewValue: '08' }, { value: '09', viewValue: '09' },
        { value: '10', viewValue: '10' }, { value: '11', viewValue: '11' }, { value: '12', viewValue: '12' }];

        this._currentYear = this._currentDate.getFullYear();
        this._yearsArray = [];
        this._yearsArray.push({ value: this._currentYear, viewValue: this._currentYear });

        for (let i = 1; i <= 25; i++) {
            let auxYear = { value: this._currentYear + i, viewValue: this._currentYear + i };
            this._yearsArray.push(auxYear);
        }
        this._userAgent = navigator.userAgent;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
    * This function changes de country to select
    *@param {Country} _country
    */
    changeCountry(_country: Country) {
        this._cities = Cities.find({ country: _country._id }).zone();
        this._countryName = _country.name;
    }

    /**
    * This function changes de credit card payment method to select
    *@param {string} _paymentName
    */
    changeCcPaymentLogo(_paymentName: string) {
        this._paymentLogoName = 'images/' + _paymentName + '.png';
        this._ccMethodPayment = _paymentName;
    }

    /**
    * This function opens de dialog to confirm the payment
    */
    openConfirmDialog() {
        let auxstreet: string = this._paymentForm.value.streetOne;
        this._establishmentsNamesArray = [];

        if (this._mode === 'normal') {
            Establishments.find({ creation_user: Meteor.userId(), isActive: true }).fetch().forEach((establishment) => {
                this._establishmentsNamesArray.push(establishment.name);
            });
        } else {
            Establishments.find({ creation_user: Meteor.userId(), isActive: false, _id: this._mode }).fetch().forEach((establishment) => {
                this._establishmentsNamesArray.push(establishment.name);
            });
        }

        this._mdDialogRef = this._mdDialog.open(CcPaymentConfirmComponent, {
            disableClose: true,
            data: {
                streetone: this._selectedAddress,
                city: this._selectedCity,
                country: this._selectedCountry.name,
                fullname: this._paymentForm.value.fullName,
                telephone: this._selectedPhone,
                ccmethod: this._paymentLogoName,
                cardnumber: this._paymentForm.value.cardNumber,
                price: this._valueToPay,
                currency: this._currency,
                establishmentsArray: this._establishmentsNamesArray,
                customerName: Meteor.user().profile.first_name + ' ' + Meteor.user().profile.last_name
            },
            height: '85%',
            width: '51,5%'
        });

        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                this._loading = true;
                setTimeout(() => {
                    this.getPayInfo();
                }, 5000);
            }
        });
    }

    /**
     * This function gets custPayInfo credentials
     */
    getPayInfo() {

        try {
            this.fillAuthorizationCaptureObject(this._payuPaymentService.al, this._payuPaymentService.ak, this._payuPaymentService.ai, this._payuPaymentService.mi);
        } catch (e) {
            let errorMsg = this.itemNameTraduction('PAYU_PAYMENT_FORM.UNAVAILABLE_PAYMENT');
            this.openDialog(this.titleMsg, '', errorMsg, '', this.btnAcceptLbl, false);
            this._loading = false;
            this._router.navigate(['/app/monthly-payment']);
        }
    }

    /**
     * This function fills the request object and sends to PayU Rest service
     */
    fillAuthorizationCaptureObject(al: string, ak: string, ai: number, mi: string) {

        let paymentTransactionF: PaymentTransaction;
        let paymentTransaction: PaymentTransaction;
        let userDetail: UserDetail;
        let buyerCity: string;
        let buyerCountry: string;

        let ccRequestColombia = new CcRequestColombia();
        let merchant = new Merchant();
        let transaction = new Transaction();
        let order = new Order();
        let buyer = new Buyer();
        let buyerShippingAddress = new ShippingBillingAddress();
        let additionalValues = new AdditionalValues();
        let tx_value = new TX_VALUE();
        let tx_tax = new TX_TAX();
        let tx_tax_return_base = new TX_TAX_RETURN_BASE();
        let creditCard = new CreditCard();
        let payer = new Payer();
        let payerBillingAddress = new ShippingBillingAddress();
        let extraParameters = new ExtraParameters();
        let apilogin: string;
        let apikey: string;
        let credentialArray: string[] = [];
        let transactionMessage: string;
        let transactionIcon: string;
        let showCancelBtn: boolean = false;
        let payuPaymentsApiURI: string;

        //let isProd: boolean = (this.is_prod_flag == 'true');
        let prefixTrxParam: string = Parameters.findOne({ name: 'payu_reference_code' }).value;

        userDetail = UserDetails.findOne({ user_id: Meteor.userId() });

        if (userDetail.city_id !== '') {
            buyerCity = Cities.findOne({ _id: userDetail.city_id }).name;
        } else {
            buyerCity = userDetail.other_city
        }

        buyerCountry = Countries.findOne({ _id: userDetail.country_id }).alfaCode2;

        paymentTransactionF = PaymentTransactions.collection.findOne({}, { sort: { count: -1 } });
        if (paymentTransactionF) {
            PaymentTransactions.collection.insert({
                count: paymentTransactionF.count + 1,
                referenceCode: prefixTrxParam + (paymentTransactionF.count + 1),
                status: 'PREPARED',
                creation_date: new Date(),
                creation_user: Meteor.userId()
            });
        } else {
            PaymentTransactions.collection.insert({
                count: 1,
                referenceCode: prefixTrxParam + 1,
                status: 'PREPARED',
                creation_date: new Date(),
                creation_user: Meteor.userId()
            });
        }
        paymentTransaction = PaymentTransactions.collection.findOne({}, { sort: { count: -1 } });
        apilogin = al;
        apikey = ak;

        ccRequestColombia.language = Meteor.user().profile.language_code;
        ccRequestColombia.command = 'SUBMIT_TRANSACTION';
        merchant.apiLogin = apilogin;
        merchant.apiKey = apikey;
        ccRequestColombia.merchant = merchant;

        order.accountId = Number(ai);
        order.referenceCode = paymentTransaction.referenceCode;
        order.description = this.itemNameTraduction('PAYU_PAYMENT_FORM.ORDER_DESCRIPTION');
        order.language = Meteor.user().profile.language_code;
        order.signature = this.generateOrderSignature(apikey, paymentTransaction.referenceCode, mi);

        buyer.merchantBuyerId = Meteor.userId();
        buyer.fullName = Meteor.user().profile.first_name + ' ' + Meteor.user().profile.last_name;
        buyer.emailAddress = Meteor.user().emails[0].address;
        buyer.contactPhone = userDetail.contact_phone;
        buyer.dniNumber = userDetail.dni_number;

        //buyer shipping address
        buyerShippingAddress.street1 = userDetail.address;
        buyerShippingAddress.city = buyerCity;
        buyerShippingAddress.country = buyerCountry;

        //aditional values
        tx_value.value = Number(this._valueToPay);
        tx_value.currency = this._currency;
        additionalValues.TX_VALUE = tx_value;

        tx_tax.value = 0;
        tx_tax.currency = this._currency;
        additionalValues.TX_TAX = tx_tax;

        tx_tax_return_base.value = 0;
        tx_tax_return_base.currency = this._currency;
        additionalValues.TX_TAX_RETURN_BASE = tx_tax_return_base;

        order.additionalValues = additionalValues;
        buyer.shippingAddress = buyerShippingAddress;
        order.buyer = buyer;

        creditCard.number = this._paymentForm.value.cardNumber;
        creditCard.securityCode = this._paymentForm.value.securityCode;
        creditCard.expirationDate = this._selectedCardYear + '/' + this._selectedCardMonth;

        if (this.isProd) {
            creditCard.name = this._paymentForm.value.fullName;
        } else {
            let testState: string = Parameters.findOne({ name: 'payu_test_state' }).value;
            creditCard.name = testState;
        }

        payer.fullName = this._paymentForm.value.fullName;
        payer.emailAddress = Meteor.user().emails[0].address;
        payer.contactPhone = this._selectedPhone;
        payer.dniNumber = this._selectedDniNumber;

        payerBillingAddress.street1 = this._selectedAddress;
        payerBillingAddress.city = this._selectedCity;
        payerBillingAddress.country = buyerCountry;
        payer.billingAddress = payerBillingAddress;

        extraParameters.INSTALLMENTS_NUMBER = 1;

        transaction.order = order;
        transaction.payer = payer;
        transaction.creditCard = creditCard;
        transaction.extraParameters = extraParameters;

        transaction.type = 'AUTHORIZATION_AND_CAPTURE';
        transaction.paymentMethod = this._selectedPaymentMethod;
        transaction.paymentCountry = 'CO';

        transaction.deviceSessionId = this._deviceSessionId;
        transaction.ipAddress = this._ipAddress;
        transaction.cookie = this._session_id;
        transaction.userAgent = this._userAgent;

        ccRequestColombia.transaction = transaction;

        if (this.isProd) {
            ccRequestColombia.test = false;
            payuPaymentsApiURI = Parameters.findOne({ name: 'payu_payments_url_prod' }).value;
        } else {
            ccRequestColombia.test = true;
            payuPaymentsApiURI = Parameters.findOne({ name: 'payu_payments_url_test' }).value;
        }

        this._payuPaymentService.authorizeAndCapture(payuPaymentsApiURI, ccRequestColombia).subscribe(
            response => {
                if (response.code == 'ERROR') {
                    transactionMessage = 'PAYU_PAYMENT_FORM.AUTH_ERROR_MSG';
                    transactionIcon = 'trn_declined.png';
                    showCancelBtn = true;
                } else if (response.code == 'SUCCESS') {
                    showCancelBtn = false;
                    switch (response.transactionResponse.state) {
                        case "APPROVED": {
                            this.insertHistoryUpdateTransaction(response, paymentTransaction._id);
                            transactionMessage = 'PAYU_PAYMENT_FORM.TRANSACTION_APPROVED';
                            transactionIcon = 'trn_approved.png';
                            break;
                        }
                        case "DECLINED": {
                            this.insertHistoryUpdateTransaction(response, paymentTransaction._id);
                            transactionMessage = 'PAYU_PAYMENT_FORM.TRANSACTION_DECLINED';
                            transactionIcon = 'trn_declined.png';
                            break;
                        }
                        case "PENDING": {
                            this.insertHistoryUpdateTransaction(response, paymentTransaction._id);
                            transactionMessage = 'PAYU_PAYMENT_FORM.TRANSACTION_PENDING';
                            transactionIcon = 'trn_pending.png';
                            break;
                        }
                        case "EXPIRED": {
                            this.insertHistoryUpdateTransaction(response, paymentTransaction._id);
                            transactionMessage = 'PAYU_PAYMENT_FORM.TRANSACTION_EXPIRED';
                            transactionIcon = 'trn_declined.png';
                            break;
                        }
                        default: {
                            this.insertHistoryUpdateTransaction(response, paymentTransaction._id);
                            transactionMessage = 'PAYU_PAYMENT_FORM.TRANSACTION_ERROR';
                            transactionIcon = 'trn_declined.png';
                            break;
                        }
                    }
                }
                this._loading = false;
                this._mdDialogRef2 = this._mdDialog.open(TrnResponseConfirmComponent, {
                    disableClose: true,
                    data: {
                        transactionResponse: transactionMessage,
                        transactionImage: transactionIcon,
                        showCancel: showCancelBtn
                    },
                });

                this._mdDialogRef2.afterClosed().subscribe(result => {
                    this._mdDialogRef2 = result;
                    if (result.success) {
                        this._router.navigate(['app/payment-history']);
                    }
                });
            },
            error => {
                let errorMsg = this.itemNameTraduction('PAYU_PAYMENT_FORM.UNAVAILABLE_PAYMENT');
                this.openDialog(this.titleMsg, '', errorMsg, '', this.btnAcceptLbl, false);
                this._loading = false;
                this._router.navigate(['/app/monthly-payment']);
            }
        );
    }

    /**
     * This function inserts the history Payment status and update the payment transaction 
     * @param {string} _status
     * */
    insertHistoryUpdateTransaction(_response: any, _transactionId: string) {

        PaymentTransactions.collection.update({ _id: _transactionId },
            {
                $set: {
                    status: _response.transactionResponse.state,
                    responseCode: _response.transactionResponse.responseCode,
                    responseMessage: _response.transactionResponse.responseMessage,
                    responseOrderId: _response.transactionResponse.orderId,
                    responsetransactionId: _response.transactionResponse.transactionId,
                    modification_date: new Date(),
                    modification_user: Meteor.userId()
                }
            });

        let transactionId = PaymentTransactions.collection.findOne({ _id: _transactionId })._id;

        this._establishmentsIdsArray = [];

        if (this._mode === 'normal') {
            Establishments.find({ creation_user: Meteor.userId(), isActive: true }).fetch().forEach((establishment) => {
                this._establishmentsIdsArray.push(establishment._id);
            });
        } else {
            Establishments.find({ creation_user: Meteor.userId(), isActive: false, _id: this._mode }).fetch().forEach((establishment) => {
                this._establishmentsIdsArray.push(establishment._id);
            });
        }

        let payment_history: string = PaymentsHistory.collection.insert({
            establishment_ids: this._establishmentsIdsArray,
            startDate: this._firstMonthDay,
            endDate: this._lastMonthDay,
            month: (this._currentDate.getMonth() + 1).toString(),
            year: (this._currentDate.getFullYear()).toString(),
            status: 'TRANSACTION_STATUS.' + _response.transactionResponse.state,
            paymentTransactionId: transactionId,
            paymentValue: Number(this._valueToPay),
            currency: this._currency,
            creation_date: new Date(),
            creation_user: Meteor.userId(),
            isInitial: false
        });

        if (_response.transactionResponse.state == 'APPROVED') {
            if (this._mode != 'normal') {
                Establishments.collection.update({ _id: this._mode }, { $set: { isActive: true, firstPay: false } });

                Tables.collection.find({ establishment_id: this._mode }).forEach(function <Table>(table, index, ar) {
                    Tables.collection.update({ _id: table._id }, { $set: { is_active: true } });
                });
            } else {
                this._establishmentsIdsArray.forEach((resId: string) => {
                    Establishments.collection.update({ _id: resId }, { $set: { isActive: true, firstPay: false } });
                });
            }

            //Call meteor method for generate iurest invoice
            MeteorObservable.call('generateInvoiceInfo', payment_history, Meteor.userId()).subscribe();
        }
    }

    /**
     * This function gets the tax value according to the value
     * @param {number} _value
     */
    getValueTax(): number {
        let percentValue: number;
        let parameterTax: Parameter = Parameters.findOne({ name: 'colombia_tax_iva' });
        percentValue = Number(parameterTax.value);
        return (this._valueToPay * percentValue) / 100;
    }

    /**
     * This function gets the tax value according to the value
     * @param {number} _value
     */
    getReturnBase(): number {
        let amountPercent: number = this.getValueTax();
        return this._valueToPay - amountPercent;
    }

    /**
    * This function generates the order signature to fill request object
    * @param {string} _apikey
    * @param {string} _referenceCode
    * @return {string}
    */
    generateOrderSignature(_apikey: string, _referenceCode, mi: string): string {
        let signatureEncoded: string = md5(_apikey + '~' + mi + '~' + _referenceCode + '~' + this._valueToPay + '~' + this._currency);
        return signatureEncoded;
    }

    /**
     * Function to translate information
     * @param {string} _itemName
     * @return {string}
     */
    itemNameTraduction(_itemName: string): string {
        var _wordTraduced: string;
        this._translate.get(_itemName).subscribe((res: string) => {
            _wordTraduced = res;
        });
        return _wordTraduced;
    }

    /**
    * This function open de error dialog according to parameters 
    * @param {string} title
    * @param {string} subtitle
    * @param {string} content
    * @param {string} btnCancelLbl
    * @param {string} btnAcceptLbl
    * @param {boolean} showBtnCancel
    */
    openDialog(title: string, subtitle: string, content: string, btnCancelLbl: string, btnAcceptLbl: string, showBtnCancel: boolean) {

        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: title,
                subtitle: subtitle,
                content: content,
                buttonCancel: btnCancelLbl,
                buttonAccept: btnAcceptLbl,
                showBtnCancel: showBtnCancel
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {

            }
        });
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}