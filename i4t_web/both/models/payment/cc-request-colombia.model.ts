/**
 * CcRequestColombia model
 */
export class CcRequestColombia {
    language: string;
    command: string;
    merchant: Merchant;
    transaction: Transaction;
    test: boolean;
}

/**
 * Merchant model
 */
export class Merchant {
    apiKey: string;
    apiLogin: string;
}

/**
 * Transaction model
 */
export class Transaction {
    order: Order;
    payer: Payer;
    creditCard: CreditCard;
    extraParameters?: ExtraParameters;
    type: string;
    paymentMethod: string;
    paymentCountry: string;
    deviceSessionId: string;
    ipAddress: string;
    cookie: string;
    userAgent: string;
}

/**
 * Order model
 */
export class Order {
    accountId: number;
    referenceCode: string;
    description: string;
    language: string;
    signature: string;
    notifyUrl?: string;
    additionalValues: AdditionalValues;
    buyer: Buyer;
    shippingAddress?: ShippingBillingAddress;
}

/**
 * Payer model
 */
export class Payer {
    merchantPayerId?: string;
    fullName: string;
    emailAddress: string;
    contactPhone: string;
    dniNumber: string;
    billingAddress: ShippingBillingAddress;
}

/**
 * CreditCard model
 */
export class CreditCard {
    number: string;
    securityCode: string;
    expirationDate: string;
    name: string;
}

/**
 * ExtraParameters model
 */
export class ExtraParameters {
    INSTALLMENTS_NUMBER?: number;
    RESPONSE_URL?: string;
}

/**
 * AdditionalValues model
 */
export class AdditionalValues {
    TX_VALUE: TX_VALUE;
    TX_TAX?: TX_TAX;
    TX_TAX_RETURN_BASE?: TX_TAX_RETURN_BASE;
}

/**
 * TX_VALUE model
 */
export class TX_VALUE {
    value: number;
    currency: string;
}

/**
 * TX_TAX model
 */
export class TX_TAX {
    value: number;
    currency: string;
}

/**
 * TX_TAX_RETURN_BASE model
 */
export class TX_TAX_RETURN_BASE {
    value: number;
    currency: string;
}

/**
 * Buyer model
 */
export class Buyer {
    merchantBuyerId?: string;
    fullName: string;
    emailAddress: string;
    contactPhone: string;
    dniNumber: string;
    shippingAddress: ShippingBillingAddress;
}

/**
 * ShippingBillingAddress
 */
export class ShippingBillingAddress {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
}