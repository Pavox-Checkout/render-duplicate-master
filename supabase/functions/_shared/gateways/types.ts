// Common contract implemented by every payment gateway adapter.
// Adapters are chosen in a single place (registry.ts) — no provider `if`s elsewhere.

export type ConnectionStatus =
  | "connected"
  | "invalid_credentials"
  | "expired_credentials"
  | "permission_error"
  | "gateway_unavailable"
  | "rate_limited"
  | "environment_mismatch"
  | "unknown_error";

export type ConnectionResult = {
  status: ConnectionStatus;
  /** Human label of the connected account (e.g. nickname), when available. */
  accountLabel?: string;
};

export type Buyer = {
  name: string;
  email: string;
  phone: string;
  document: string;
  person_type: "pf" | "pj";
};

export type PixInput = {
  orderId: string;
  reference: string;
  amount: number;
  description: string;
  buyer: Buyer;
  product: { id: string; name: string; unitPrice: number };
  notificationUrl: string;
  statementDescriptor: string;
  expiresAt: Date;
  /** PAVOX fee retained by the gateway (split). Omitted when not applicable. */
  marketplaceFee?: number | null;
};

export type PixResult = {
  paymentId: string;
  status: NormalizedPaymentStatus;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string | null;
  expiresAt: string | null;
};

export type NormalizedPaymentStatus = "pending" | "approved" | "rejected" | "cancelled" | "expired" | "refunded";

export type PaymentInfo = {
  id: string;
  status: NormalizedPaymentStatus;
  rawStatus: string;
  amount: number;
  currency: string;
  externalReference: string | null;
};

export class GatewayError extends Error {
  constructor(
    public code: ConnectionStatus | "payment_rejected" | "invalid_request",
    message: string,
    public httpStatus?: number,
  ) {
    super(message);
  }
}

export interface PaymentGateway {
  testConnection(): Promise<ConnectionResult>;
  createPix(input: PixInput): Promise<PixResult>;
  getPayment(paymentId: string): Promise<PaymentInfo>;
}
