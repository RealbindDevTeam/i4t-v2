import { Component, OnInit, OnDestroy, NgZone, Input } from '@angular/core';
import { MeteorObservable } from "meteor-rxjs";
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { MatDialogRef, MatDialog } from '@angular/material';
import { UserLanguageService } from '../../services/general/user-language.service';
//import { Invoice, InvoiceLegalInformation } from '../../../../../../both/models/establishment/invoice.model';
//import { Invoices } from '../../../../../../both/collections/establishment/invoice.collection';
import { Establishment } from '../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../both/collections/establishment/establishment.collection';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../../../both/models/auth/user-detail.model';
import { AlertConfirmComponent } from '../../general/alert-confirm/alert-confirm.component';

let jsPDF = require('jspdf');

@Component({
    selector: 'iu-customer-payments-history',
    templateUrl: './customer-payments-history.component.html',
    styleUrls: ['./customer-payments-history.component.scss']
})

export class CustomerPaymentsHistoryComponent implements OnInit, OnDestroy {

    private _invoicesHistorySubscription: Subscription;

    private _invoices: any;
    private _showPayments: boolean = true;
    public _dialogRef: MatDialogRef<any>;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private panelOpenState: boolean = false;

    /**
     * CustomerPaymentsHistoryComponent component
     * @param {NgZone} _ngZone 
     * @param {TranslateService} _translate 
     * @param {MatDialog} _dialog
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _ngZone: NgZone,
        public _translate: TranslateService,
        public _dialog: MatDialog,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._invoicesHistorySubscription = MeteorObservable.subscribe('getInvoicesByUserId', Meteor.userId()).subscribe(() => {
            this._ngZone.run(() => {
                //this._invoices = Invoices.find({}).zone();
                this.countInvoices();
                this._invoices.subscribe(() => { this.countInvoices(); });
            });
        });
    }

    /**
     * Validate if Invoices exists
     */
    countInvoices(): void {
        //Invoices.collection.find({}).count() > 0 ? this._showPayments = true : this._showPayments = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._invoicesHistorySubscription) { this._invoicesHistorySubscription.unsubscribe(); }
    }

    /**
     * Generate Invoice pdf
     * @param { Invoice } _pInvoice 
     * @param {string} _pCountryId
     */
    invoiceGenerate(_pInvoice, _pCountryId: string) {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (_pCountryId === '1900') {
            //this.generateColombiaInvoice(_pInvoice, _pCountryId);
        }
    }

    /**
     * Generate colombia restaurant invoice
     * @param {Invoice} _pInvoice
     
    generateColombiaInvoice(_pInvoice: Invoice, _pCountryId: string): void {
        let heightPage: number = this.calculateHeight(_pInvoice, _pCountryId);

        let widthText: number = 180;
        let x: number = 105;
        let y: number = 35;
        let maxLength: number = 48;
        let alignCenter: string = 'center';
        let alignRight: string = 'right';
        let pdf = new jsPDF("portrait", "pt", [209.76, heightPage]);

        pdf.setFontSize(8);
        let splitBusinessName = pdf.splitTextToSize(_pInvoice.legal_information.business_name, widthText);
        let splitNit = pdf.splitTextToSize(_pInvoice.legal_information.document, widthText);
        let splitRestaurantName = pdf.splitTextToSize(_pInvoice.restaurant_name, widthText);
        let splitAddress = pdf.splitTextToSize(_pInvoice.restaurant_address, widthText);
        let splitPhone = pdf.splitTextToSize(_pInvoice.restaurant_phone, widthText);

        let despcriptionTitle = 'Descripción';
        let quantTitle = 'Cant.';
        let valueTitle = 'Valor';

        pdf.text(splitBusinessName, x, y, alignCenter);
        if (_pInvoice.legal_information.business_name.length > maxLength) {
            y = this.calculateY(y, 20);
        } else {
            y = this.calculateY(y, 10);
        }
        pdf.text(splitNit, x, y, alignCenter);
        y = this.calculateY(y, 10);
        pdf.setFontType("bold");
        pdf.text(splitRestaurantName, x, y, alignCenter);
        if (_pInvoice.restaurant_name.length >= 40) {
            y = this.calculateY(y, 20);
        } else {
            y = this.calculateY(y, 10);
        }

        pdf.setFontType("normal");
        pdf.text(splitAddress, x, y, alignCenter);
        if (_pInvoice.restaurant_address.length > maxLength) {
            y = this.calculateY(y, 20);
        } else {
            y = this.calculateY(y, 10);
        }
        pdf.text('Teléfono: ' + splitPhone, x, y, alignCenter);

        y = this.calculateY(y, 20);
        pdf.setFontType("bold");
        pdf.text('Factura de venta', 10, y);

        if (_pInvoice.legal_information.prefix) {
            pdf.text(_pInvoice.legal_information.prefix_name + '-' + _pInvoice.legal_information.number, 120, y);
        } else {
            pdf.text(_pInvoice.legal_information.number, 120, y);
        }

        y = this.calculateY(y, 10);
        pdf.setFontType("normal");
        pdf.text('Fecha-Hora', 10, y);
        pdf.text(this.dateFormater(_pInvoice.creation_date, true), 120, y);

        y = this.calculateY(y, 10);
        pdf.text(x, y, '==========================================', alignCenter);

        pdf.setFontType("bold");
        y = this.calculateY(y, 15);
        pdf.text(despcriptionTitle, 10, y);
        pdf.text(quantTitle, 120, y);
        pdf.text(valueTitle, 200, y, alignRight);
        pdf.setFontType("normal");

        y = this.calculateY(y, 20);

        _pInvoice.items.forEach((item) => {
            let splitItemName = pdf.splitTextToSize(item.item_name, 100);
            pdf.text(10, y, splitItemName);
            pdf.text(140, y, item.quantity.toString(), alignRight);
            pdf.text(200, y, (item.price * item.quantity).toString() + ' ' + _pInvoice.currency, alignRight);

            if (item.item_name.length <= 23) {
                y = this.calculateY(y, 10);
            } else if (item.item_name.length > 23 && item.item_name.length <= 46) {
                y = this.calculateY(y, 20);
            } else {
                y = this.calculateY(y, 30);
            }

            if (item.garnish_food.length > 0) {
                item.garnish_food.forEach((garnish_food: Object) => {
                    let splitItemGarnishFood = pdf.splitTextToSize(garnish_food['garnish_food_name'], 100);
                    pdf.text(10, y, splitItemGarnishFood);
                    pdf.text(140, y, item.quantity.toString(), alignRight);
                    pdf.text(200, y, (garnish_food['price'] * item.quantity).toString() + ' ' + _pInvoice.currency, alignRight);

                    if (garnish_food['garnish_food_name'].length <= 23) {
                        y = this.calculateY(y, 10);
                    } else if (garnish_food['garnish_food_name'].length > 23 && garnish_food['garnish_food_name'].length <= 46) {
                        y = this.calculateY(y, 20);
                    } else {
                        y = this.calculateY(y, 30);
                    }
                });
            }

            if (item.additions.length > 0) {
                item.additions.forEach((addition: Object) => {
                    let splitItemAddition = pdf.splitTextToSize(addition['addition_name'], 100);
                    pdf.text(10, y, splitItemAddition);
                    pdf.text(140, y, item.quantity.toString(), alignRight);
                    pdf.text(200, y, (addition['price'] * item.quantity).toString() + ' ' + _pInvoice.currency, alignRight);

                    if (addition['addition_name'].length <= 23) {
                        y = this.calculateY(y, 10);
                    } else if (addition['addition_name'].length > 23 && addition['addition_name'].length <= 46) {
                        y = this.calculateY(y, 20);
                    } else {
                        y = this.calculateY(y, 30);
                    }
                });
            }
        });

        _pInvoice.additions.forEach((addition) => {
            let splitItemAddition = pdf.splitTextToSize(addition.addition_name, 100);
            pdf.text(10, y, splitItemAddition);
            pdf.text(140, y, addition.quantity.toString(), alignRight);
            pdf.text(200, y, (addition.price * addition.quantity).toString() + ' ' + _pInvoice.currency, alignRight);

            if (addition.addition_name.length <= 23) {
                y = this.calculateY(y, 10);
            } else if (addition.addition_name.length > 23 && addition.addition_name.length <= 46) {
                y = this.calculateY(y, 20);
            } else {
                y = this.calculateY(y, 30);
            }
        });

        if (_pInvoice.legal_information.regime === 'regime_co') {
            y = this.calculateY(y, 10);
            pdf.setFontType("bold");
            pdf.text(80, y, 'SubTotal');
            pdf.text(200, y, (_pInvoice.total_order).toFixed(2) + ' ' + _pInvoice.currency, alignRight);
            pdf.setFontType("normal");

            y = this.calculateY(y, 10);
            pdf.text(80, y, 'Base IMPO');
            pdf.text(200, y, ((_pInvoice.total_order * 100) / 108).toFixed(2) + ' ' + _pInvoice.currency, alignRight);

            y = this.calculateY(y, 10);
            pdf.text(80, y, 'IMPO (8%)');
            pdf.text(200, y, (_pInvoice.total_order - ((_pInvoice.total_order * 100) / 108)).toFixed(2) + ' ' + _pInvoice.currency, alignRight);

            y = this.calculateY(y, 10);
            pdf.text(80, y, 'Propina');
            pdf.text(200, y, (_pInvoice.total_tip).toFixed(2) + ' ' + _pInvoice.currency, alignRight);

            y = this.calculateY(y, 10);
            pdf.setFontType("bold");
            pdf.text(80, y, 'Total a pagar');

            y = this.calculateY(y, 10);
            pdf.text(80, y, this.itemNameTraduction(_pInvoice.pay_method));
            pdf.text(200, y, (_pInvoice.total_pay).toFixed(2) + ' ' + _pInvoice.currency, alignRight);
            pdf.setFontType("normal");
        } else if (_pInvoice.legal_information.regime === 'regime_si') {
            if (_pInvoice.legal_information.forced_to_invoice) {
                y = this.calculateY(y, 20);
                pdf.setFontType("bold");
                pdf.text(80, y, 'SubTotal');
                pdf.text(200, y, (_pInvoice.total_order).toFixed(2) + ' ' + _pInvoice.currency, alignRight);
                pdf.setFontType("normal");

                y = this.calculateY(y, 10);
                pdf.text(80, y, 'Propina');
                pdf.text(200, y, (_pInvoice.total_tip).toFixed(2) + ' ' + _pInvoice.currency, alignRight);

                y = this.calculateY(y, 10);
                pdf.setFontType("bold");
                pdf.text(80, y, 'Total a pagar');

                y = this.calculateY(y, 10);
                pdf.text(80, y, this.itemNameTraduction(_pInvoice.pay_method));
                pdf.text(200, y, (_pInvoice.total_pay).toFixed(2) + ' ' + _pInvoice.currency, alignRight);
                pdf.setFontType("normal");
            }
        }

        y = this.calculateY(y, 20);
        pdf.text(x, y, '==========================================', alignCenter);
        y = this.calculateY(y, 10);
        pdf.setFontType("bold");
        if (_pInvoice.legal_information.regime === 'regime_co') {
            pdf.text(x, y, 'RÉGIMEN COMÚN', alignCenter);
        } else if (_pInvoice.legal_information.regime === 'regime_si') {
            pdf.text(x, y, 'RÉGIMEN SIMPLIFICADO', alignCenter);
        }
        pdf.setFontType("normal");
        if (_pInvoice.legal_information.invoice_resolution && _pInvoice.legal_information.invoice_resolution_date) {
            y = this.calculateY(y, 10);
            pdf.text(x, y, 'Res. DIAN No. ' + _pInvoice.legal_information.invoice_resolution + ' de ' + this.dateFormater(_pInvoice.legal_information.invoice_resolution_date, false), alignCenter);
        }

        let auxNumeration = this.getNumerationLabel(_pInvoice.legal_information);
        if (_pInvoice.legal_information.prefix) {
            let splitNumeration = pdf.splitTextToSize(auxNumeration, widthText);
            if (auxNumeration.length >= 68) {
                y = this.calculateY(y, 20);
            } else if (auxNumeration.length >= 35 && auxNumeration.length <= 67) {
                y = this.calculateY(y, 10);
            }
            pdf.text(x, y, splitNumeration, alignCenter);
            y = this.calculateY(y, 10);
        } else {
            let splitNumeration = pdf.splitTextToSize(auxNumeration, widthText);
            if (auxNumeration.length >= 68) {
                y = this.calculateY(y, 20);
            } else if (auxNumeration.length >= 35 && auxNumeration.length <= 67) {
                y = this.calculateY(y, 10);
            }
            pdf.text(x, y, splitNumeration, alignCenter);
            y = this.calculateY(y, 10);
        }

        let auxBigContributor = this.getBigContributorLabel(_pInvoice.legal_information);
        if (_pInvoice.legal_information.is_big_contributor) {
            let splitIsBigContributor = pdf.splitTextToSize(auxBigContributor, widthText);
            if (auxBigContributor.length >= 68) {
                y = this.calculateY(y, 20);
            } else if (auxBigContributor.length >= 35 && auxBigContributor.length <= 67) {
                y = this.calculateY(y, 10);
            }
            pdf.text(splitIsBigContributor, x, y, alignCenter);
            y = this.calculateY(y, 10);
        } else {
            let splitIsBigContributor = pdf.splitTextToSize(auxBigContributor, widthText);
            if (auxBigContributor.length >= 68) {
                y = this.calculateY(y, 20);
            } else if (auxBigContributor.length >= 35 && auxBigContributor.length <= 67) {
                y = this.calculateY(y, 10);
            }
            pdf.text(splitIsBigContributor, x, y, alignCenter);
            y = this.calculateY(y, 10);
        }

        let auxSelfAccepting = this.getSelfAcceptingLabel(_pInvoice.legal_information);
        if (_pInvoice.legal_information.is_self_accepting) {
            let splitIsSelfAccepting = pdf.splitTextToSize(auxSelfAccepting, widthText);
            if (auxSelfAccepting.length >= 68) {
                y = this.calculateY(y, 20);
            } else if (auxSelfAccepting.length >= 35 && auxSelfAccepting.length <= 67) {
                y = this.calculateY(y, 10);
            }
            pdf.text(splitIsSelfAccepting, x, y, alignCenter);
            y = this.calculateY(y, 10);
        } else {
            let splitIsSelfAccepting = pdf.splitTextToSize(auxSelfAccepting, widthText);
            if (auxSelfAccepting.length >= 68) {
                y = this.calculateY(y, 20);
            } else if (auxSelfAccepting.length >= 35 && auxSelfAccepting.length <= 67) {
                y = this.calculateY(y, 10);
            }
            pdf.text(auxSelfAccepting, x, y, alignCenter);
            y = this.calculateY(y, 10);
        }

        if (_pInvoice.legal_information.is_retaining_agent) {
            let splitRetainingAgent = pdf.splitTextToSize('Agentes Retenedores de IVA e ICA', widthText);
            y = this.calculateY(y, 10);
            pdf.text(splitRetainingAgent, x, y, alignCenter);
            y = this.calculateY(y, 20);
        } else {
            let splitRetainingAgent = pdf.splitTextToSize('No somos Agentes Retenedores de IVA e ICA', widthText);
            y = this.calculateY(y, 10);
            pdf.text(splitRetainingAgent, x, y, alignCenter);
            y = this.calculateY(y, 20);
        }
        pdf.text(x, y, '==========================================', alignCenter);

        if (_pInvoice.legal_information.text_at_the_end !== null && _pInvoice.legal_information.text_at_the_end !== undefined
            && _pInvoice.legal_information.text_at_the_end.length > 0) {
            y = this.calculateY(y, 10);
            let splitFinalText = pdf.splitTextToSize(_pInvoice.legal_information.text_at_the_end, widthText);
            pdf.text(splitFinalText, x, y, alignCenter);

            if (_pInvoice.legal_information.text_at_the_end.length >= 145) {
                y = this.calculateY(y, 40);
            } else if (_pInvoice.legal_information.text_at_the_end.length >= 97 && _pInvoice.legal_information.text_at_the_end.length <= 144) {
                y = this.calculateY(y, 30);
            } else if (_pInvoice.legal_information.text_at_the_end.length >= 49 && _pInvoice.legal_information.text_at_the_end.length <= 96) {
                y = this.calculateY(y, 20);
            } else if (_pInvoice.legal_information.text_at_the_end.length <= 48) {
                y = this.calculateY(y, 10);
            }
            pdf.text(x, y, '==========================================', alignCenter);
        }

        y = this.calculateY(y, 10);
        pdf.text(x, y, 'Desarrollado por Realbind S.A.S', alignCenter);

        y = this.calculateY(y, 10);
        pdf.text(x, y, 'NIT 901.036.585-0', alignCenter);

        y = this.calculateY(y, 10);
        pdf.text(x, y, 'www.iurest.com', alignCenter);

        pdf.setFontType("bold");
        y = this.calculateY(y, 10);

        pdf.text(x, y, 'FACTURA EMITIDA POR COMPUTADOR', alignCenter);

        pdf.setProperties({
            title: this.itemNameTraduction('PAYMENTS_HISTORY.INVOICE_SALE'),
            author: this.itemNameTraduction('PAYMENTS_HISTORY.SOFTWARE_BY_REALBIND'),
        });

        if (_pInvoice.legal_information.prefix_name) {
            pdf.save(_pInvoice.legal_information.prefix_name + '_' + _pInvoice.legal_information.number + '_' + this.dateFormater(_pInvoice.creation_date, false) + '.pdf');
        } else {
            pdf.save(_pInvoice.legal_information.number + '_' + this.dateFormater(_pInvoice.creation_date, false) + '.pdf');
        }
    }*/

    /**
     * Allow add top to pdf page
     * @param { number } _pY 
     * @param { number } _pAdd 
     */
    calculateY(_pY: number, _pAdd: number): number {
        _pY = _pY + _pAdd;
        return _pY;
    }

    /**
     * Calculate Invoice pdf height
     * @param { Invoice } _pInvoice 
     * @param { string } _pCountryId
     */
    calculateHeight(_pInvoice, _pCountryId: string): number {
        let quantRows: number = 0;
        let heightPage: number = 220;

        if (_pCountryId === '1900') {
            _pInvoice.items.forEach((item) => {
                if (item.item_name.length <= 23) {
                    quantRows = quantRows + 1;
                } else if (item.item_name.length > 23 && item.item_name.length <= 46) {
                    quantRows = quantRows + 2;
                } else {
                    quantRows = quantRows + 3;
                }

                if (item.garnish_food.length > 0) {
                    item.garnish_food.forEach((garnish) => {
                        if (garnish.garnish_food_name.length <= 23) {
                            quantRows = quantRows + 1;
                        } else if (garnish.garnish_food_name.length > 23 && garnish.garnish_food_name.length <= 46) {
                            quantRows = quantRows + 2;
                        } else {
                            quantRows = quantRows + 3;
                        }
                    });
                }

                if (item.additions.length > 0) {
                    item.additions.forEach((addition) => {
                        if (addition.addition_name.length <= 23) {
                            quantRows = quantRows + 1;
                        } else if (addition.addition_name.length > 23 && addition.addition_name.length <= 46) {
                            quantRows = quantRows + 2;
                        } else {
                            quantRows = quantRows + 3;
                        }
                    });
                }
            });

            _pInvoice.additions.forEach((addition) => {
                if (addition.addition_name.length <= 23) {
                    quantRows = quantRows + 1;
                } else if (addition.addition_name.length > 23 && addition.addition_name.length <= 46) {
                    quantRows = quantRows + 2;
                } else {
                    quantRows = quantRows + 3;
                }
            });

            let auxNumeration = this.getNumerationLabel(_pInvoice.legal_information);
            if (_pInvoice.legal_information.prefix) {
                if (auxNumeration.length >= 68) {
                    quantRows = quantRows + 2;
                } else if (auxNumeration.length >= 35 && auxNumeration.length <= 67) {
                    quantRows = quantRows + 1;
                }
            } else {
                if (auxNumeration.length >= 68) {
                    quantRows = quantRows + 2;
                } else if (auxNumeration.length >= 35 && auxNumeration.length <= 67) {
                    quantRows = quantRows + 1;
                }
            }

            let auxBigContributor = this.getBigContributorLabel(_pInvoice.legal_information);
            if (_pInvoice.legal_information.is_big_contributor) {
                if (auxBigContributor.length >= 68) {
                    quantRows = quantRows + 2;
                } else if (auxBigContributor.length >= 35 && auxBigContributor.length <= 67) {
                    quantRows = quantRows + 1;
                }
            } else {
                if (auxBigContributor.length >= 68) {
                    quantRows = quantRows + 2;
                } else if (auxBigContributor.length >= 35 && auxBigContributor.length <= 67) {
                    quantRows = quantRows + 1;
                }
            }

            let auxSelfAccepting = this.getSelfAcceptingLabel(_pInvoice.legal_information);
            if (_pInvoice.legal_information.is_self_accepting) {
                if (auxSelfAccepting.length >= 68) {
                    quantRows = quantRows + 2;
                } else if (auxSelfAccepting.length >= 35 && auxSelfAccepting.length <= 67) {
                    quantRows = quantRows + 1;
                }
            } else {
                if (auxSelfAccepting.length >= 68) {
                    quantRows = quantRows + 2;
                } else if (auxSelfAccepting.length >= 35 && auxSelfAccepting.length <= 67) {
                    quantRows = quantRows + 1;
                }
            }

            if (_pInvoice.legal_information.text_at_the_end !== null && _pInvoice.legal_information.text_at_the_end !== undefined
                && _pInvoice.legal_information.text_at_the_end.length > 0) {
                quantRows = quantRows + 1;
                if (_pInvoice.legal_information.text_at_the_end.length <= 40) {
                    quantRows = quantRows + 1;
                } else if (_pInvoice.legal_information.text_at_the_end.length > 41 && _pInvoice.legal_information.text_at_the_end.length <= 80) {
                    quantRows = quantRows + 2;
                } else if (_pInvoice.legal_information.text_at_the_end.length > 81 && _pInvoice.legal_information.text_at_the_end.length <= 120) {
                    quantRows = quantRows + 3;
                } else {
                    quantRows = quantRows + 4;
                }
                quantRows = quantRows + 1;
            }

            heightPage = heightPage + (quantRows * 10);
        } else {
            quantRows = quantRows + _pInvoice.items.length;
            quantRows = quantRows + _pInvoice.additions.length;
            _pInvoice.items.forEach((item) => {
                quantRows = quantRows + item.garnish_food.length;
                quantRows = quantRows + item.additions.length;
            });
            heightPage = heightPage + (quantRows * 30);
        }
        heightPage = heightPage + 195;
        return heightPage;
    }

    /**
     * This function gets the numeratio label 
     * @param {InvoiceLegalInformation} _pInvoiceLegal
     */
    getNumerationLabel(_pInvoiceLegal): string {
        let auxNumeration: string;
        if (_pInvoiceLegal.prefix) {
            auxNumeration = 'HABILITA FAC: ' + _pInvoiceLegal.prefix_name + '-' + _pInvoiceLegal.numeration_from + ' al ' + _pInvoiceLegal.prefix_name + '-' + _pInvoiceLegal.numeration_to;
        } else {
            auxNumeration = 'HABILITA FAC: ' + _pInvoiceLegal.numeration_from + ' al ' + _pInvoiceLegal.numeration_to;
        }
        return auxNumeration;
    }

    /**
     * This function gets the big contributor label
     * @param {InvoiceLegalInformation} _pInvoiceLegal
     */
    getBigContributorLabel(_pInvoiceLegal): string {
        let auxBigContributor: string;
        if (_pInvoiceLegal.is_big_contributor) {
            auxBigContributor = 'Grandes contribuyentes según Res.No. ' + _pInvoiceLegal.big_contributor_resolution + ' de ' + this.dateFormater(_pInvoiceLegal.big_contributor_date, false);
        } else {
            auxBigContributor = 'No somos grandes contribuyentes';
        }
        return auxBigContributor;
    }

    /**
     * This function gets self accepting label
     * @param {InvoiceLegalInformation} _pInvoiceLegal
     */
    getSelfAcceptingLabel(_pInvoiceLegal): string {
        let auxSelfAccepting: string;
        if (_pInvoiceLegal.is_self_accepting) {
            auxSelfAccepting = 'Autorretenedores según Res.No. ' + _pInvoiceLegal.self_accepting_resolution + ' de ' + this.dateFormater(_pInvoiceLegal.self_accepting_date, false);
        } else {
            auxSelfAccepting = 'No somos Autorretenedores';
        }
        return auxSelfAccepting;
    }

    /**
     * Allow return date format
     * @param {Date} _pDate 
     * @param {boolean} _time
     */
    dateFormater(_pDate: Date, _time: boolean): string {
        let dateFormat = (_pDate.getDate() <= 9 ? '0' + _pDate.getDate() : _pDate.getDate()) + '/' +
            (_pDate.getMonth() + 1 <= 9 ? '0' + (_pDate.getMonth() + 1) : (_pDate.getMonth() + 1)) + '/' +
            (_pDate.getFullYear()) + ' '
        if (_time) {
            dateFormat += (_pDate.getHours() <= 9 ? '0' + _pDate.getHours() : _pDate.getHours()) + ':' +
                (_pDate.getMinutes() <= 9 ? '0' + _pDate.getMinutes() : _pDate.getMinutes());
        }
        return dateFormat;
    }

    /**
     * This function validates if string crop
     * @param { string } _pItemName 
     */
    itemNameCrop(_pItemName: string): string {
        if (_pItemName.length > 20 && _pItemName.indexOf(' ') <= 0) {
            return _pItemName.substring(1, 20) + '...';
        } else {
            return _pItemName;
        }
    }

    /**
     * Function to validate if user can download restaurant invoice
     * @param {Invoice} _pInvoice 
     * @param {string} _pCountryId 
     */
    isInvoiceCanDownload(_pInvoice, _pCountryId: string): boolean {
        if (_pCountryId === '1900') {
            if (_pInvoice.legal_information.regime === 'regime_co') {
                return true;
            } else if (_pInvoice.legal_information.regime === 'regime_si') {
                if (_pInvoice.legal_information.forced_to_invoice) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return true;
        }
    }

    /**
   * This function allow translate strings
   * @param {string} _itemName 
   */
    itemNameTraduction(_itemName: string): string {
        var wordTraduced: string;
        this._translate.get(_itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
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

        this._dialogRef = this._dialog.open(AlertConfirmComponent, {
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
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = result;
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