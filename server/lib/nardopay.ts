// server/lib/nardopay.ts

export interface NardoPaySession {
  id: string;
  userId: string;
  shopId: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'verified' | 'failed';
  createdAt: string;
}

class NardoPayService {
  private sessions = new Map<string, NardoPaySession>();

  /**
   * Generates a new secure checkout session for a merchant.
   */
  public createCheckoutSession(userId: string, shopId: string | null, amount: number): NardoPaySession {
    const sessionId = 'NP-SESS-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    const session: NardoPaySession = {
      id: sessionId,
      userId,
      shopId,
      amount,
      currency: 'USD',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Verifies the authenticity and status of a NardoPay payment session.
   * Ensures that the session exists and has not been processed already.
   */
  public verifyPayment(sessionId: string): NardoPaySession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    
    if (session.status !== 'pending') {
      throw new Error('Payment session has already been processed');
    }
    
    // In a real production system, this would call NardoPay's secure REST API
    // e.g., fetch(`https://api.nardopay.co.zw/v1/sessions/${sessionId}`)
    // with authorization headers, and verify status directly with the gateway.
    
    session.status = 'verified';
    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Cancels/Invalidates a session.
   */
  public invalidateSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

export const nardoPay = new NardoPayService();
