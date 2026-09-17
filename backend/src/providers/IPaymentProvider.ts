export interface PaymentIntentData {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
}

export interface WebhookResult {
  paymentId: string;
  providerTransactionId: string;
  status: 'SUCCESS' | 'FAILED';
  rawPayload: any;
}

export interface IPaymentProvider {
  /**
   * Generates a checkout URL to redirect the user to the gateway
   */
  generateCheckoutUrl(data: PaymentIntentData): Promise<string>;

  /**
   * Verifies the cryptographic signature of an incoming webhook
   */
  verifySignature(payload: any, signature: string): boolean;

  /**
   * Parses the webhook payload into a standardized format
   */
  parseWebhook(payload: any): WebhookResult;
}
