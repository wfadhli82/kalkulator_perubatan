import type { AidType, DeliveryFee, DiaperTender, MilkTender } from "../data/types";
import { formatMoneyText, productLabel } from "./formatters";

const DAYS = 30;

export const getZoneFromParliament = (parliament: string, zones: { parliament: string; zone: string }[]) =>
  zones.find((item) => item.parliament === parliament)?.zone ?? "";

export const getDeliveryFee = (
  aidType: AidType,
  zone: string,
  supplier: string,
  deliveryFees: DeliveryFee[]
) =>
  deliveryFees.find(
    (item) =>
      item.active &&
      item.aidType === aidType &&
      item.zone === zone &&
      item.supplier.trim().toUpperCase() === supplier.trim().toUpperCase()
  )?.deliveryFee ?? null;

export const calculateMilkDailyAid = (monthlyQuantity: number, unitPrice: number, deliveryFee: number) => {
  const totalUnits = monthlyQuantity;
  const itemValue = totalUnits * unitPrice;
  return {
    kind: "Susu" as const,
    totalUnits,
    itemValue,
    deliveryFee,
    totalAid: itemValue + deliveryFee
  };
};

export const calculateDiaperDailyAid = (piecesPerDay: number, pcsPerPack: number, packPrice: number, deliveryFee: number) => {
  const totalPieces = piecesPerDay * DAYS;
  const totalPacks = Math.ceil(totalPieces / pcsPerPack);
  const itemValue = totalPacks * packPrice;
  return {
    kind: "Lampin" as const,
    totalPieces,
    totalPacks,
    itemValue,
    deliveryFee,
    totalAid: itemValue + deliveryFee
  };
};

export const buildMilkApprovalText = (zone: string, product: MilkTender, monthlyQuantity: number, deliveryFee: number) => {
  const result = calculateMilkDailyAid(monthlyQuantity, product.unitPrice, deliveryFee);
  const unit = product.unit.toUpperCase();
  return `ZON ${zone}. SUSU ${productLabel(product.productName, product.specification).toUpperCase()}. ${monthlyQuantity} ${unit} SEBULAN. ${result.totalUnits} ${unit} x RM${formatMoneyText(product.unitPrice)} = RM${formatMoneyText(result.itemValue)}. *KOS HANTAR RM${formatMoneyText(deliveryFee)}* = RM${formatMoneyText(result.totalAid)}`;
};

export const buildDiaperApprovalText = (zone: string, product: DiaperTender, piecesPerDay: number, deliveryFee: number) => {
  const result = calculateDiaperDailyAid(piecesPerDay, product.pcsPerPack, product.packPrice, deliveryFee);
  return `*${product.diaperType.toUpperCase()}:*\nZON ${zone}. LAMPIN ${product.productName.toUpperCase()} (${product.diaperType.toUpperCase()}) ${product.pcsPerPack}'S SAIZ ${product.size}. ${piecesPerDay} KEPING SEHARI x 30 HARI = ${result.totalPieces} KEPING / ${result.totalPacks} PEK. ${result.totalPacks} PEK x RM${formatMoneyText(product.packPrice)} = RM${formatMoneyText(result.itemValue)}. *KOS HANTAR RM${formatMoneyText(deliveryFee)}* = RM${formatMoneyText(result.totalAid)}`;
};
