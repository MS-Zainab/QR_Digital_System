export type BusinessType = "cafe" | "restaurant" | "salon" | "retail";

export interface Merchant {
  id: string;
  name: string;
  businessType: BusinessType;
  logoUrl?: string;
  primaryColor: string;
  stampsRequired: number;
  rewardDescription: string;
  createdAt: string;
  slug?: string | null;
}

export interface Customer {
  id: string;
  phoneNumber: string;
  name?: string;
}

export interface CustomerCard {
  id: string;
  customerId: string;
  merchantId: string;
  stampCount: number;
  isRedeemed: boolean;
  updatedAt: string;
  merchant?: Merchant;
}

export interface ScanLog {
  id: string;
  customerId: string;
  merchantId: string;
  pinUsed: string;
  scannedAt: string;
  merchant?: Merchant;
}

export interface ScanResponse {
  success: boolean;
  stampCount: number;
  stampsRequired: number;
  rewardUnlocked: boolean;
  rewardDescription: string;
  error?: string;
}