// server/lib/nardopayClient.ts

import crypto from 'crypto';

export interface CreatePaymentLinkParams {
  link_type: 'subscription' | 'one_time';
  plan_name: string;
  amount: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  description: string;
  webhook_url: string;
  metadata: {
    profile_id: string;
    shop_id: string;
    category: string;
    plan: string;
    [key: string]: any;
  };
}

export interface NardoPayLinkResponse {
  link_code: string;
  url: string;
  link_id?: string;
  [key: string]: any;
}

export interface VerifyPaymentParams {
  link_code?: string;
  subscription_id?: string;
  profile_id?: string;
}

const DEFAULT_API_KEY = 'np_live_4b6a513509513a342cf3cf91d535d054fa2b38385cb9e9c78e4888dcbf1c21a2';
const CREATE_LINK_URL = 'https://mczqwqsvumfsneoknlep.supabase.co/functions/v1/create-payment-link-api';
const VERIFY_STATUS_URL = 'https://nardopay.com/functions/v1/verify-payment-status';

export class NardoPayClient {
  private getApiKey(): string {
    return process.env.NARDOPAY_API_KEY || DEFAULT_API_KEY;
  }

  /**
   * Calls NardoPay API to create a subscription payment link.
   * Securely uses the server-side API key.
   */
  public async createPaymentLink(params: CreatePaymentLinkParams): Promise<NardoPayLinkResponse> {
    const apiKey = this.getApiKey();

    console.log('[NardoPayClient] Creating payment link for shop:', params.metadata.shop_id, {
      amount: params.amount,
      currency: params.currency,
      billing_cycle: params.billing_cycle,
      webhook_url: params.webhook_url
    });

    try {
      const response = await fetch(CREATE_LINK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[NardoPayClient] Create payment link failed HTTP', response.status, errorText);
        throw new Error(`NardoPay API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('[NardoPayClient] Payment link successfully created:', {
        link_code: data.link_code || data.code,
        url: data.url,
        link_id: data.link_id || data.id
      });

      return {
        link_code: data.link_code || data.code || '',
        url: data.url || `https://checkout.nardopay.com/${data.link_code || data.code}`,
        link_id: data.link_id || data.id || data.link_code || null,
        ...data
      };
    } catch (err: any) {
      console.error('[NardoPayClient] Network or API exception creating payment link:', err.message);
      throw new Error(`PAYMENT_PROVIDER_UNAVAILABLE: ${err.message}`);
    }
  }

  /**
   * Verifies the HMAC SHA-256 signature sent by NardoPay in the webhook header.
   * Compares the computed digest with the received signature.
   */
  public verifyWebhookSignature(rawBody: string, signatureHeader?: string | string[] | null): boolean {
    if (!signatureHeader || !rawBody) {
      console.warn('[NardoPayClient] Missing signature header or raw body for webhook verification');
      return false;
    }

    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const apiKey = this.getApiKey();

    try {
      const hmac = crypto.createHmac('sha256', apiKey);
      hmac.update(rawBody);
      const computedHex = hmac.digest('hex');

      // Normalize signatures (clean whitespace and lower-case)
      const cleanReceived = signature.trim().toLowerCase().replace(/^sha256=/, '');
      const cleanComputed = computedHex.trim().toLowerCase();

      // Timing-safe comparison if lengths match
      if (cleanReceived.length === cleanComputed.length) {
        return crypto.timingSafeEqual(
          Buffer.from(cleanReceived, 'utf-8'),
          Buffer.from(cleanComputed, 'utf-8')
        );
      }

      return cleanReceived === cleanComputed;
    } catch (err: any) {
      console.error('[NardoPayClient] Error during signature verification:', err.message);
      return false;
    }
  }

  /**
   * Manual payment status verification fallback for reconciliation.
   */
  public async verifyPaymentStatus(params: VerifyPaymentParams): Promise<any> {
    const apiKey = this.getApiKey();

    try {
      const response = await fetch(VERIFY_STATUS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('[NardoPayClient] verifyPaymentStatus returned non-200:', response.status, errorText);
        return null;
      }

      return await response.json();
    } catch (err: any) {
      console.error('[NardoPayClient] verifyPaymentStatus error:', err.message);
      return null;
    }
  }
}

export const nardopayClient = new NardoPayClient();
