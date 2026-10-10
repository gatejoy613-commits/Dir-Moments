export type Plan = "free" | "pro" | "featured";

// From the plan's tier table. All prices are starting guesses to test in vendor interviews.
export const TIERS: Record<Plan, {
  photos: number; videos: number; packages: number; premiumLooks: boolean;
  stats: "views" | "full" | "full+compare"; homepage: boolean;
}> = {
  free: { photos: 12, videos: 1, packages: 3, premiumLooks: false, stats: "views", homepage: false },
  pro: { photos: 40, videos: 5, packages: Infinity, premiumLooks: true, stats: "full", homepage: false },
  featured: { photos: 80, videos: 10, packages: Infinity, premiumLooks: true, stats: "full+compare", homepage: true },
};

export const PRICES: Record<"pro" | "featured", Record<"month" | "season" | "year", number>> = {
  pro: { month: 600, season: 1600, year: 5500 },
  featured: { month: 1800, season: 4800, year: 16000 },
};

export const TERM_DAYS = { month: 30, season: 91, year: 365, founding: 91 } as const;

// Sponsored placement rules (published to vendors and clients).
export const SPONSORED_PER_PAGE = 3;
export const SLOTS_PER_CATEGORY_SUBCITY = 5;
export const SPONSOR_MIN_RATING = 3.5;
export const SPONSOR_MAX_NO_SHOWS = 1;
export const FOUNDING_VENDOR_LIMIT = 100;
