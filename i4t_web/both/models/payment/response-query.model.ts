/**
 * ResponseQuery model
 */
export class ResponseQuery {
    language: string;
    command: string;
    merchant: Merchant;
    details: Details;
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
 * Details model
 */
export class Details {
    transactionId: string;
}