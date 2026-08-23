export const PLATFORM_FEE = 5;
export const FREE_DELIVERY_KM = 1;
export const DELIVERY_FEE_PER_KM = 10;
export const RESTAURANT_COMMISSION_RATE = 0.10;
export const RIDER_REFERRAL_SHARE = 0.20;

export function deliveryPricing(distanceKm) {
  const normalizedDistance = Math.max(0.1, Number(distanceKm));
  const chargeableKm = Math.max(0, Math.ceil(normalizedDistance - FREE_DELIVERY_KM));
  return { distanceKm: normalizedDistance, chargeableKm, deliveryFee: chargeableKm * DELIVERY_FEE_PER_KM };
}
