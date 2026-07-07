export type AidType = "Susu" | "Lampin";
export type Category = "Dewasa" | "Kanak-kanak";
export type DiaperType = "Tape" | "Pants";
export type DiaperQuantityMode = "Harian" | "Bulanan";

export interface ParliamentZone {
  parliament: string;
  zone: string;
}

export interface MilkTender {
  id: string;
  zone: string;
  supplier: string;
  category: Category;
  productName: string;
  specification: string;
  unit: string;
  unitPrice: number;
  active: boolean;
}

export interface DiaperTender {
  id: string;
  zone: string;
  supplier: string;
  category: Category;
  diaperType: DiaperType;
  productName: string;
  packDescription: string;
  pcsPerPack: number;
  size: string;
  packPrice: number;
  active: boolean;
}

export interface DeliveryFee {
  aidType: AidType;
  zone: string;
  supplier: string;
  deliveryFee: number;
  active: boolean;
}

export interface MilkResult {
  kind: "Susu";
  totalUnits: number;
  itemValue: number;
  deliveryFee: number;
  totalAid: number;
}

export interface DiaperResult {
  kind: "Lampin";
  quantityMode: DiaperQuantityMode;
  totalPieces: number;
  totalPacks: number;
  itemValue: number;
  deliveryFee: number;
  totalAid: number;
}

export type CalculationResult = MilkResult | DiaperResult;
