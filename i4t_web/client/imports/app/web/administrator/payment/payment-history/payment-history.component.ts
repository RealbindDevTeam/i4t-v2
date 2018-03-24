import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef, MatDialog } from '@angular/material';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { VerifyResultComponent } from './verify-result/verify-result.component';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { PaymentsHistory } from '../../../../../../../both/collections/payment/payment-history.collection';
import { PaymentHistory } from '../../../../../../../both/models/payment/payment-history.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { ResponseQuery, Merchant, Details } from '../../../../../../../both/models/payment/response-query.model';
import { PaymentTransactions } from '../../../../../../../both/collections/payment/payment-transaction.collection';
import { PaymentTransaction } from '../../../../../../../both/models/payment/payment-transaction.model';
import { Tables } from '../../../../../../../both/collections/establishment/table.collection';
import { Table } from '../../../../../../../both/models/establishment/table.model';
import { AlertConfirmComponent } from '../../../../web/general/alert-confirm/alert-confirm.component';
import { Parameter } from '../../../../../../../both/models/general/parameter.model';
import { Parameters } from '../../../../../../../both/collections/general/parameter.collection';
import { UserDetail } from '../../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../../both/collections/auth/user-detail.collection';
import { City } from '../../../../../../../both/models/general/city.model';
import { Cities } from '../../../../../../../both/collections/general/city.collection';
import { Country } from '../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../both/collections/general/country.collection';
import { IurestInvoices } from '../../../../../../../both/collections/payment/iurest-invoices.collection';
import { IurestInvoice } from '../../../../../../../both/models/payment/iurest-invoice.model';
import { PayuPaymentService } from '../../../services/payment/payu-payment.service';

let jsPDF = require('jspdf');

@Component({
    selector: 'payment-history',
    templateUrl: './payment-history.component.html',
    styleUrls: ['./payment-history.component.scss']
})
export class PaymentHistoryComponent implements OnInit, OnDestroy {

    private _historyPaymentSub: Subscription;
    private _establishmentSub: Subscription;
    private _paymentTransactionSub: Subscription;
    private _parameterSub: Subscription;
    private _userDetailSub: Subscription;
    private _countrySub: Subscription;
    private _citySub: Subscription;
    private _iurestInvoiceSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _historyPayments: Observable<PaymentHistory[]>;
    private _historyPayments2: Observable<PaymentHistory[]>;
    private _paymentTransactions: Observable<PaymentTransaction[]>;

    private _selectedMonth: string;
    private _selectedYear: string;
    private _yearsArray: any[];
    private _monthsArray: any[];
    private _currentDate: Date;
    private _currentYear: number;
    private _activateMonth: boolean;
    private _loading: boolean;
    private _mdDialogRef: MatDialogRef<any>;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _thereArePaymentsHistory: boolean = true;

    private is_prod_flag: string;
    private isProd: boolean;

    /**
     * PaymentHistoryComponent Constructor
     * @param {Router} _router 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {MatDialog} _mdDialog 
     * @param {PayuPaymenteService} _payuPaymentService 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private _router: Router,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        public _mdDialog: MatDialog,
        private _payuPaymentService: PayuPaymentService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');

        this._currentDate = new Date();
        this._activateMonth = true;

        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();

        this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        this._countrySub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe();
        this._citySub = MeteorObservable.subscribe('cities').takeUntil(this._ngUnsubscribe).subscribe();
        this._historyPaymentSub = MeteorObservable.subscribe('getHistoryPaymentsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._historyPayments2 = PaymentsHistory.find({ creation_user: Meteor.userId() }).zone();
                this.countPaymentsHistory();
                this._historyPayments2.subscribe(() => { this.countPaymentsHistory(); });
                this._historyPayments = PaymentsHistory.find({
                    creation_user: Meteor.userId(),
                    creation_date: {
                        $gte: new Date(new Date().getFullYear(), 0, 1),
                        $lte: new Date(new Date().getFullYear(), 11, 31)
                    }
                },
                    { sort: { creation_date: -1 } }).zone();
            });
        });

        this._iurestInvoiceSub = MeteorObservable.subscribe('getIurestInvoiceByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        this._establishmentSub = MeteorObservable.subscribe('establishments', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        this._paymentTransactionSub = MeteorObservable.subscribe('getTransactionsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();

        this._parameterSub = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this.is_prod_flag = Parameters.findOne({ name: 'payu_is_prod' }).value;
                this.isProd = (this.is_prod_flag == 'true');
            });
        });

        this._currentYear = this._currentDate.getFullYear();
        this._yearsArray = [];
        this._yearsArray.push({ value: this._currentYear, viewValue: this._currentYear });

        for (let i = 1; i <= 2; i++) {
            let auxYear = { value: this._currentYear - i, viewValue: this._currentYear - i };
            this._yearsArray.push(auxYear);
        }

        this._monthsArray = [{ value: '01', viewValue: '01' }, { value: '02', viewValue: '02' }, { value: '03', viewValue: '03' },
        { value: '04', viewValue: '04' }, { value: '05', viewValue: '05' }, { value: '06', viewValue: '06' },
        { value: '07', viewValue: '07' }, { value: '08', viewValue: '08' }, { value: '09', viewValue: '09' },
        { value: '10', viewValue: '10' }, { value: '11', viewValue: '11' }, { value: '12', viewValue: '12' }];
    }

    /**
     * Validate if user payments history exists
     */
    countPaymentsHistory(): void {
        PaymentsHistory.collection.find({ creation_user: Meteor.userId() }).count() > 0 ? this._thereArePaymentsHistory = true : this._thereArePaymentsHistory = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * This function enable month select component and update history payment query
     */
    changeHistoryPaymentYear() {
        let _selectedYearNum: number = Number(this._selectedYear);
        this._historyPayments = PaymentsHistory.find({
            creation_user: Meteor.userId(),
            creation_date: {
                $gte: new Date(_selectedYearNum, 0, 1),
                $lte: new Date(_selectedYearNum, 11, 31)
            }
        },
            { sort: { creation_date: -1 } }).zone();

        this._activateMonth = false;
        this._selectedMonth = "0";
    }

    /**
     * This function update history payment by month and year
     */
    changeHistoryPaymentMonth() {
        let _selectedMonthNum: number = Number(this._selectedMonth) - 1;
        let _selectedYearNum: number = Number(this._selectedYear);

        if (_selectedMonthNum === -1) {
            this._historyPayments = PaymentsHistory.find({
                creation_user: Meteor.userId(),
                creation_date: {
                    $gte: new Date(_selectedYearNum, 0, 1),
                    $lte: new Date(_selectedYearNum, 11, 31)
                }
            },
                { sort: { creation_date: -1 } }).zone();
        }
        else {
            this._historyPayments = PaymentsHistory.find({
                creation_user: Meteor.userId(),
                creation_date: {
                    $gte: new Date(_selectedYearNum, _selectedMonthNum, 1),
                    $lte: new Date(_selectedYearNum, _selectedMonthNum, 31)
                }
            },
                { sort: { creation_date: -1 } }).zone();
        }
    }

    /**
     * This function returns de status payment image 
     * @param {string} _status
     */
    getImageName(_status: string): string {
        let imgStr: string = '';
        switch (_status) {
            case 'TRANSACTION_STATUS.APPROVED': {
                imgStr = '/images/trn_approved.png';
                break;
            }
            case 'TRANSACTION_STATUS.DECLINED': {
                imgStr = '/images/trn_declined.png';
                break;
            }
            case 'TRANSACTION_STATUS.PENDING': {
                imgStr = '/images/trn_pending.png';
                break;
            }
            case 'TRANSACTION_STATUS.EXPIRED': {
                imgStr = '/images/trn_declined.png';
                break;
            }
            default: {
                imgStr = '/images/trn_declined.png';
                break;
            }
        }
        return imgStr;
    }

    /**
     * This function gets custPayInfo credentials
     */
    getPayInfo(_transactionId: string) {

        try {
            this.checkTransactionStatus(this._payuPaymentService.al, this._payuPaymentService.ak, _transactionId);
        } catch (e) {
            let errorMsg = this.itemNameTraduction('RES_PAYMENT_HISTORY.UNAVAILABLE_REPORT');
            this.openDialog(this.titleMsg, '', errorMsg, '', this.btnAcceptLbl, false);
            this._loading = false;
        }

    }

    /**
     * This function queries de transaction status
     * @param {string} _transactionId
     */
    checkTransactionStatus(al: string, ak: string, _transactionId: string) {
        let responseQuery = new ResponseQuery();
        let merchant = new Merchant();
        let details = new Details();
        let credentialArray: string[] = [];
        //let isProd: boolean = (this.is_prod_flag == 'true');
        let responseMessage: string;
        let responseIcon: string;
        let payuReportsApiURI: string;

        let historyPayment = PaymentsHistory.collection.findOne({ paymentTransactionId: _transactionId });
        if (historyPayment) {
            let paymentTransaction = PaymentTransactions.collection.findOne({ _id: historyPayment.paymentTransactionId });
            if (paymentTransaction) {
                this._loading = true;
                setTimeout(() => {
                    responseQuery.language = Meteor.user().profile.language_code;
                    responseQuery.command = 'TRANSACTION_RESPONSE_DETAIL';
                    merchant.apiLogin = al;
                    merchant.apiKey = ak;
                    responseQuery.merchant = merchant;
                    details.transactionId = paymentTransaction.responsetransactionId;
                    responseQuery.details = details;
                    if (this.isProd) {
                        responseQuery.test = false;
                        payuReportsApiURI = Parameters.findOne({ name: 'payu_reports_url_prod' }).value;
                    } else {
                        responseQuery.test = true;
                        payuReportsApiURI = Parameters.findOne({ name: 'payu_reports_url_test' }).value;
                    }

                    this._payuPaymentService.getTransactionResponse(payuReportsApiURI, responseQuery).subscribe(
                        response => {
                            if (response.code === 'ERROR') {
                                responseMessage = 'RES_PAYMENT_HISTORY.VERIFY_ERROR'
                                responseIcon = 'trn_declined.png';
                            } else if (response.code === 'SUCCESS') {
                                switch (response.result.payload.state) {
                                    case "APPROVED": {
                                        this.updateAllStatus(historyPayment, paymentTransaction, response);
                                        responseMessage = 'RES_PAYMENT_HISTORY.VERIFY_APPROVED';
                                        responseIcon = 'trn_approved.png';
                                        break;
                                    }
                                    case "DECLINED": {
                                        this.updateAllStatus(historyPayment, paymentTransaction, response);
                                        responseMessage = 'RES_PAYMENT_HISTORY.VERIFY_DECLINED';
                                        responseIcon = 'trn_declined.png';
                                        break;
                                    }
                                    case "PENDING": {
                                        this.updateAllStatus(historyPayment, paymentTransaction, response);
                                        responseMessage = 'RES_PAYMENT_HISTORY.VERIFY_PENDING';
                                        responseIcon = 'trn_pending.png';
                                        break;
                                    }
                                    case "EXPIRED": {
                                        this.updateAllStatus(historyPayment, paymentTransaction, response);
                                        responseMessage = 'RES_PAYMENT_HISTORY.VERIFY_EXPIRED';
                                        responseIcon = 'trn_declined.png';
                                        break;
                                    }
                                    default: {
                                        this.updateAllStatus(historyPayment, paymentTransaction, response);
                                        responseMessage = 'RES_PAYMENT_HISTORY.VERIFY_ERROR';
                                        responseIcon = 'trn_declined.png';
                                        break;
                                    }
                                }
                            }
                            this._mdDialogRef = this._mdDialog.open(VerifyResultComponent, {
                                disableClose: true,
                                data: {
                                    responseStatus: responseMessage,
                                    responseImage: responseIcon
                                }
                            });

                            this._mdDialogRef.afterClosed().subscribe(result => {
                                this._mdDialogRef = result;
                                if (result.success) {

                                }
                            });
                        },
                        error => {
                            let errorMsg = this.itemNameTraduction('RES_PAYMENT_HISTORY.UNAVAILABLE_REPORT');
                            this.openDialog(this.titleMsg, '', errorMsg, '', this.btnAcceptLbl, false);
                            this._loading = false;
                        }
                    );
                    this._loading = false;
                }, 5000);
            }
        }
    }

    /**
     * This function updates the history Payment status, payment transaction status, establishment and tables
     * @param {string} _status
     * */
    updateAllStatus(_historyPayment: PaymentHistory, _paymentTransaction: PaymentTransaction, _response: any) {
        PaymentTransactions.collection.update({ _id: _paymentTransaction._id },
            {
                $set: {
                    status: _response.result.payload.state,
                    responseCode: _response.result.payload.responseCode,
                    modification_user: Meteor.userId(),
                    modification_date: new Date()
                }
            });

        PaymentsHistory.collection.update({ _id: _historyPayment._id },
            {
                $set: {
                    status: 'TRANSACTION_STATUS.' + _response.result.payload.state,
                    modification_user: Meteor.userId(),
                    modification_date: new Date()
                }
            });

        if (_response.result.payload.state == 'APPROVED') {
            _historyPayment.establishment_ids.forEach((establishmentId) => {
                Establishments.collection.update({ _id: establishmentId }, { $set: { isActive: true, firstPay: false } });

                Tables.collection.find({ establishment_id: establishmentId }).forEach(function <Table>(table, index, ar) {
                    Tables.collection.update({ _id: table._id }, { $set: { is_active: true } });
                });
            });

            //Call meteor method for generate iurest invoice
            MeteorObservable.call('generateInvoiceInfo', _historyPayment._id, Meteor.userId()).subscribe();
        }
    }

    /**
     * This functions gets de establishment name by id
     * @param {string }_establishmentId 
     */
    getEstablishmentName(_establishmentId: string): string {
        let establishment = Establishments.findOne({ _id: _establishmentId });
        if (establishment) {
            return establishment.name;
        } else {
            return '';
        }
    }

    /**
     * This function generates de invoice
     */
    generateInvoice(_paymentHistory: PaymentHistory) {
        let iurest_invoice: IurestInvoice = IurestInvoices.findOne({ payment_history_id: _paymentHistory._id });
        let invoice_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.INVOICE_LBL');
        let number_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.NUMBER_LBL');
        let date_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.DATE_LBL');
        let cc_payment_lbl = this.itemNameTraduction('PAYU_PAYMENT_FORM.CC_PAYMENT_METHOD');
        let customer_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.CUSTOMER_LBL');
        let desc_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.DESCRIPTION_LBL');
        let period_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.PERIOD_LBL');
        let amount_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.AMOUNT_LBL');
        let subtotal_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.SUBTOTAL');
        let iva_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.IVA');
        let total_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.TOTAL');
        let fileName = this.itemNameTraduction('RES_PAYMENT_HISTORY.INVOICE');
        let resolution_msg = this.itemNameTraduction('RES_PAYMENT_HISTORY.RESOLUTION_MSG');
        let res_from_date = this.itemNameTraduction('RES_PAYMENT_HISTORY.INVOICE_START_DATE');
        let res_to_date = this.itemNameTraduction('RES_PAYMENT_HISTORY.INVOICE_END_DATE');
        let res_from_value = this.itemNameTraduction('RES_PAYMENT_HISTORY.INVOICE_START_VALUE');
        let res_to_value = this.itemNameTraduction('RES_PAYMENT_HISTORY.INVOICE_END_VALUE');
        let payment_method_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.PAYMENT_METHOD')
        let identication_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.IDENTIFICATION_NUMBER');
        let phone_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.TELEPHONE_NUMBER');
        let email_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.EMAIL');
        let aux_payment_method = this.itemNameTraduction(iurest_invoice.payment_method);
        let aux_country = this.itemNameTraduction(iurest_invoice.client_info.country);
        let aux_description = this.itemNameTraduction(iurest_invoice.description);

        let qr_pdf = new jsPDF("portrait", "mm", "a4");
        var myImage = new Image();
        myImage.src = '/images/logo_iurest.png';

        myImage.onload = function () {
            qr_pdf.addImage(myImage, 'png', 13, 13, 35, 10);

            qr_pdf.setFontSize(10);
            qr_pdf.text(iurest_invoice.company_info.name, 195, 15, 'right');
            qr_pdf.text(iurest_invoice.company_info.address, 195, 20, 'right');
            qr_pdf.text(iurest_invoice.company_info.city + ', ' + iurest_invoice.company_info.country, 195, 25, 'right');
            qr_pdf.text(iurest_invoice.company_info.phone, 195, 30, 'right');
            qr_pdf.text(iurest_invoice.company_info.nit, 195, 35, 'right');
            qr_pdf.text(iurest_invoice.company_info.regime, 195, 40, 'right');
            qr_pdf.text(iurest_invoice.company_info.contribution, 195, 45, 'right');
            qr_pdf.text(iurest_invoice.company_info.retainer, 195, 50, 'right');
            qr_pdf.text(iurest_invoice.company_info.agent_retainter, 195, 55, 'right');
            qr_pdf.text(resolution_msg + ' ' + iurest_invoice.company_info.resolution_number, 195, 60, 'right');

            let from_date_formatted = iurest_invoice.company_info.resolution_start_date.getDate() + '/' +
                (iurest_invoice.company_info.resolution_start_date.getMonth() + 1) + '/' +
                iurest_invoice.company_info.resolution_start_date.getFullYear();
            let to_date_formatted = iurest_invoice.company_info.resolution_end_date.getDate() + '/' +
                (iurest_invoice.company_info.resolution_end_date.getMonth() + 1) + '/' +
                iurest_invoice.company_info.resolution_end_date.getFullYear();
            qr_pdf.text(res_from_date + ' ' + from_date_formatted + ' ' + res_to_date + ' ' + to_date_formatted, 195, 65, 'right');

            qr_pdf.text(res_from_value + ' ' + iurest_invoice.company_info.resolution_prefix + '-' + iurest_invoice.company_info.resolution_start_value + ' ' +
                res_to_value + ' ' + iurest_invoice.company_info.resolution_prefix + '-' + iurest_invoice.company_info.resolution_end_value, 195, 70, 'right');

            qr_pdf.setFontSize(12);
            qr_pdf.setFontStyle('bold');
            qr_pdf.text(invoice_lbl, 15, 45);
            qr_pdf.setFontStyle('normal');
            qr_pdf.text(number_lbl + iurest_invoice.company_info.resolution_prefix + '-' + iurest_invoice.number, 15, 50);

            let dateFormated = iurest_invoice.creation_date.getDate() + '/' + (iurest_invoice.creation_date.getMonth() + 1) + '/' + iurest_invoice.creation_date.getFullYear();
            qr_pdf.text(date_lbl + dateFormated, 15, 55);
            qr_pdf.text(payment_method_lbl + aux_payment_method, 15, 60);
            qr_pdf.setFontSize(12);
            qr_pdf.setFontStyle('bold');
            qr_pdf.text(customer_lbl, 15, 70);
            qr_pdf.setFontStyle('normal');
            qr_pdf.text(iurest_invoice.client_info.name, 15, 75);
            qr_pdf.text(iurest_invoice.client_info.address, 15, 80);
            qr_pdf.text(iurest_invoice.client_info.city + ', ' + aux_country, 15, 85);
            qr_pdf.text(identication_lbl + '' + iurest_invoice.client_info.identification, 15, 90);
            qr_pdf.text(phone_lbl + '' + iurest_invoice.client_info.phone, 15, 95);
            qr_pdf.text(email_lbl + '' + iurest_invoice.client_info.email, 15, 100);
            qr_pdf.setFontStyle('bold');
            qr_pdf.text(desc_lbl, 15, 115);
            qr_pdf.text(period_lbl, 110, 115);
            qr_pdf.text(amount_lbl, 195, 115, 'right');
            qr_pdf.line(15, 117, 195, 117);
            qr_pdf.setFontStyle('normal');
            var splitTitle = qr_pdf.splitTextToSize(aux_description, 75);
            qr_pdf.text(15, 125, splitTitle);
            qr_pdf.text(iurest_invoice.period, 110, 125);
            qr_pdf.text(iurest_invoice.total.toString(), 185, 125, 'right');
            qr_pdf.text(iurest_invoice.currency, 195, 125, 'right');
            qr_pdf.line(15, 140, 195, 140);
            qr_pdf.setFontStyle('bold');
            qr_pdf.text(subtotal_lbl, 110, 150);
            qr_pdf.setFontStyle('normal');
            qr_pdf.text(iurest_invoice.total.toString(), 185, 150, 'right');
            qr_pdf.text(iurest_invoice.currency, 195, 150, 'right');
            qr_pdf.setFontStyle('bold');
            qr_pdf.text(iva_lbl, 110, 155);
            qr_pdf.setFontStyle('normal');
            qr_pdf.text(iurest_invoice.iva.toString(), 185, 155, 'right');
            qr_pdf.text(iurest_invoice.currency, 195, 155, 'right');
            qr_pdf.setFontStyle('bold');
            qr_pdf.text(total_lbl, 110, 160);
            qr_pdf.setFontStyle('normal');
            qr_pdf.text(iurest_invoice.total.toString(), 185, 160, 'right');
            qr_pdf.text(iurest_invoice.currency, 195, 160, 'right');
            qr_pdf.text(iurest_invoice.generated_computer_msg, 195, 290, 'right');
            qr_pdf.output('save', iurest_invoice.number + '_' + dateFormated + '.pdf');
        }
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

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}