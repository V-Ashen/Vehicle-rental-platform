import { IPaymentProvider, PaymentIntentData, WebhookResult } from './IPaymentProvider';

export class MockGatewayProvider implements IPaymentProvider {
  async generateCheckoutUrl(data: PaymentIntentData): Promise<string> {
    // In a real provider like PayHere, this would make an API call to generate a hosted checkout URL
    return `https://mock-gateway.com/checkout?order_id=${data.orderId}&amount=${data.amount}&currency=${data.currency}`;
  }

  verifySignature(payload: any, signature: string): boolean {
    // Always trust the signature for the mock gateway
    return true; 
  }

  parseWebhook(payload: any): WebhookResult {
    // Expecting payload: { order_id: string, transaction_id: string, status: 2 (success) | -1 (failed) }
    const status = payload.status === 2 ? 'SUCCESS' : 'FAILED';
    return {
      paymentId: payload.order_id,
      providerTransactionId: payload.transaction_id,
      status,
      rawPayload: payload
    };
  }
}
