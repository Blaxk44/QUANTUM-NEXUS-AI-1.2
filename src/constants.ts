export const WALLET_ADDRESSES = {
  BNB: "0x6a68b72468a548D2374cF511b73808f4FaD66F78",
  ETH: "0x6a68b72468a548D2374cF511b73808f4FaD66F78",
  SOL: "4RDUA1pVtt6uM3zyafBRVyeuyoMpaiFzRiQM45jXa3Zd",
  TON: "UQCPPw01FTldjEuWeeup-wf80MJFGaB86IrQ1q-h_QpuDjc1"
};

export const INVESTMENT_TIERS = [
  { name: "Starter", min: 100, target: 800, cycle: "7-14 Days" },
  { name: "Growth", min: 500, target: 4500, cycle: "7-14 Days" },
  { name: "VIP", min: 1000, target: 9800, cycle: "7-14 Days" },
  { name: "Starter Leader", min: 10000, target: 110000, cycle: "7-14 Days", protection: "90%" },
  { name: "VIP Leader", min: 100000, target: 1250000, cycle: "7-14 Days", protection: "90%" }
];

export const MLM_TIERS = [
  { tier: 1, percent: 7 },
  { tier: 2, percent: 3 },
  { tier: 3, percent: 1 }
];

export const WITHDRAWAL_FEE = 12;
export const MIN_DEPOSIT = 100;
export const MIN_WITHDRAWAL = 100;
