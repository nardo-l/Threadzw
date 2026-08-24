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

export interface VerifyPaymentParams {
  link_code?: string;
  transaction_id?: string;
  reference?: string;
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
    const response = await fetch(CREATE_LINK_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getApiKey()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const bodyText = await response.text();
    let data: any;
    try {
      data = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      data = null;
    }

    if (!response.ok || !data?.url || !(data.link_code || data.code)) {
      throw new Error(`PAYMENT_PROVIDER_ERROR: NardoPay returned HTTP ${response.status}`);
    }

    const linkCode = String(data.link_code || data.code);
    return {
      ...data,
      link_code: linkCode,
      url: String(data.url),
      link_id: data.link_id || data.id || linkCode
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
