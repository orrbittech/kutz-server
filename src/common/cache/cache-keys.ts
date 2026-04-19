/** Central cache key builders — use with CACHE_MANAGER (invalidate on every related write). */
export const cacheKeys = {
  siteSettingsPublic: (): string => 'site-settings:public',
  stylesActive: (): string => 'styles:active',
  teamMembersActive: (): string => 'team-members:active',
  gallerySlidesActive: (): string => 'gallery-slides:active',
  ordersList: (clerkUserId: string): string => `orders:list:${clerkUserId}`,
  bookingsList: (clerkUserId: string): string => `bookings:list:${clerkUserId}`,
} as const;
