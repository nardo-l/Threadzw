// server/lib/nardopayClient.ts

import crypto from 'crypto';

export interface CreatePaymentLinkParams {
  link_type: 'payment' | 'subscription';
  product_name: string;
  amount: number;
  currency: string;
  description: string;
  webhook_url: string;
  redirect_url: string;
  metadata: Record<string, string>;
  plan_name?: string;
  billing_cycle?: 'monthly' | 'yearly';
}

export interface NardoPayLinkResponse {
  success?: boolean;
  link_code: string;
  url: string;
  link_id?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

const CREATE_LINK_URL = 'https://mczqwqsvumfsneoknlep.supabase.co/functions/v1/create-payment-link-api';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`PAYMENT_CONFIGURATION_MISSING: ${name}`);
  return value;
}

export class NardoPayClient {
  private getApiKey(): string {
    return requiredEnv('NARDOPAY_API_KEY');
  }

  private getWebhookSecret(): string {
    return requiredEnv('NARDOPAY_WEBHOOK_SECRET');
  }

  public async createPaymentLink(params: CreatePaymentLinkParams): Promise<NardoPayLinkResponse> {
    let response: Response;

    try {
      response = await fetch(CREATE_LINK_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.getApiKey()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
    } catch (error: any) {
      console.error('[NardoPay] Network error creating payment link:', error);
      throw new Error(`PAYMENT_PROVIDER_UNAVAILABLE: ${error?.message || 'Unable to reach NardoPay'}`);
    }

    const bodyText = await response.text();
    let data: any = null;
    try {
      data = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      // Keep the raw response for diagnostics below; do not expose it to the client
      // unless it is short and clearly an ordinary provider error message.
    }

    const responseData = data?.data || data;
    const linkCode = responseData?.link_code || responseData?.code;
    const checkoutUrl = responseData?.url || responseData?.payment_url || responseData?.checkout_url;

    if (!response.ok || !checkoutUrl || !linkCode) {
      const providerMessage =
        data?.message ||
        data?.error?.message ||
        data?.error ||
        (typeof data?.detail === 'string' ? data.detail : null) ||
        (bodyText && bodyText.length <= 500 ? bodyText : null);

      console.error('[NardoPay] Payment-link creation failed:', {
        status: response.status,
        statusText: response.statusText,
        message: providerMessage,
        body: bodyText?.slice(0, 1000)
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('PAYMENT_PROVIDER_UNAVAILABLE: NardoPay rejected the server credentials');
      }

      throw new Error(
        `PAYMENT_PROVIDER_ERROR: NardoPay returned HTTP ${response.status}${providerMessage ? ` - ${String(providerMessage).slice(0, 300)}` : ''}`
      );
    }

    return {
      ...responseData,
      link_code: String(linkCode),
      url: String(checkoutUrl),
      link_id: responseData.link_id || responseData.id || String(linkCode)
    };
  }

  /**
   * NardoPay documents X-NardoPay-Signature as an HMAC-SHA256 digest of the
   * raw request body. Verification fails closed when the header is missing.
   */
  public verifyWebhookSignature(rawBody: string, signatureHeader?: string | string[] | null): boolean {
    const received = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!received || !rawBody) return false;

    let normalized = received.trim();
    if (normalized.startsWith('sha256=')) normalized = normalized.slice('sha256='.length);

    try {
      const expected = crypto
        .createHmac('sha256', this.getWebhookSecret())
        .update(rawBody, 'utf8')
        .digest('hex');
      const receivedBuffer = Buffer.from(normalized, 'hex');
      const expectedBuffer = Buffer.from(expected, 'hex');
      return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }
}

export const nardopayClient = new NardoPayClient();
