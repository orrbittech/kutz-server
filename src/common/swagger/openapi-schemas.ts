/** Shared OpenAPI schema fragments for Swagger decorators (match runtime JSON shapes). */

export const themeTokensOpenApiSchema = {
  type: 'object',
  required: [
    'brandBrown',
    'brandCream',
    'brandOrange',
    'brandWhite',
    'background',
    'foreground',
    'primary',
    'muted',
    'card',
    'border',
  ],
  properties: {
    brandBrown: { type: 'string' },
    brandCream: { type: 'string' },
    brandOrange: { type: 'string' },
    brandWhite: { type: 'string' },
    background: { type: 'string' },
    foreground: { type: 'string' },
    primary: { type: 'string' },
    muted: { type: 'string' },
    card: { type: 'string' },
    border: { type: 'string' },
  },
};

const bookingHoursRuleOpenApi = {
  type: 'object',
  required: ['daysOfWeek', 'open', 'close'],
  properties: {
    daysOfWeek: {
      type: 'array',
      items: { type: 'integer', minimum: 0, maximum: 6 },
    },
    open: { type: 'string' },
    close: { type: 'string' },
  },
};

export const siteSettingsPublicOpenApiSchema = {
  type: 'object',
  required: [
    'businessName',
    'addressLine1',
    'city',
    'region',
    'postalCode',
    'country',
    'phone',
    'publicEmail',
    'latitude',
    'longitude',
    'openingHours',
    'bookingTimeZone',
    'bookingHours',
    'defaultLocale',
    'theme',
    'smsBookingNotificationsEnabled',
    'emailBookingNotificationsEnabled',
    'smsBookingRemindersEnabled',
    'emailBookingRemindersEnabled',
    'smsThankYouReceiptEnabled',
    'emailThankYouReceiptEnabled',
    'bookingSessionMinutes',
    'bookingBreakMinutes',
    'bookingSlotStepMinutes',
    'bookingConcurrentSeatsPerSlot',
  ],
  properties: {
    businessName: { type: 'string' },
    addressLine1: { type: 'string' },
    city: { type: 'string' },
    region: { type: 'string' },
    postalCode: { type: 'string' },
    country: { type: 'string' },
    phone: { type: 'string' },
    publicEmail: { type: 'string' },
    latitude: { type: 'number', nullable: true },
    longitude: { type: 'number', nullable: true },
    openingHours: { type: 'array', items: { type: 'string' } },
    bookingTimeZone: { type: 'string' },
    bookingHours: {
      type: 'object',
      required: ['rules'],
      properties: {
        rules: { type: 'array', items: bookingHoursRuleOpenApi },
      },
    },
    defaultLocale: { type: 'string' },
    theme: themeTokensOpenApiSchema,
    smsBookingNotificationsEnabled: { type: 'boolean' },
    emailBookingNotificationsEnabled: { type: 'boolean' },
    smsBookingRemindersEnabled: { type: 'boolean' },
    emailBookingRemindersEnabled: { type: 'boolean' },
    smsThankYouReceiptEnabled: { type: 'boolean' },
    emailThankYouReceiptEnabled: { type: 'boolean' },
    bookingSessionMinutes: { type: 'integer' },
    bookingBreakMinutes: { type: 'integer' },
    bookingSlotStepMinutes: { type: 'integer' },
    bookingConcurrentSeatsPerSlot: { type: 'integer' },
  },
};

export const lineItemOpenApiSchema = {
  type: 'object',
  required: ['name', 'quantity', 'unitPriceCents'],
  properties: {
    name: { type: 'string' },
    quantity: { type: 'integer' },
    unitPriceCents: { type: 'integer' },
  },
};

export const orderResponseOpenApiSchema = {
  type: 'object',
  required: [
    'id',
    'clerkUserId',
    'status',
    'totalCents',
    'lineItems',
    'notes',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    clerkUserId: { type: 'string' },
    status: { type: 'string' },
    totalCents: { type: 'integer' },
    lineItems: { type: 'array', items: lineItemOpenApiSchema },
    notes: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const bookingStyleSummaryOpenApiSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'description',
    'imageUrl',
    'priceCents',
    'durationMinutes',
    'category',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    imageUrl: { type: 'string', nullable: true },
    priceCents: { type: 'integer', nullable: true },
    durationMinutes: { type: 'integer', nullable: true },
    category: { type: 'string', enum: ['men', 'women', 'kids'] },
  },
};

export const bookingResponseOpenApiSchema = {
  type: 'object',
  required: [
    'id',
    'bookingCode',
    'clerkUserId',
    'scheduledAt',
    'status',
    'notes',
    'styleId',
    'styleName',
    'style',
    'styles',
    'stripePaymentIntentId',
    'paymentAmountCents',
    'paymentStatus',
    'totalDueCents',
    'amountPaidCents',
    'outstandingCents',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    bookingCode: { type: 'string', minLength: 1 },
    clerkUserId: { type: 'string' },
    scheduledAt: { type: 'string' },
    status: { type: 'string' },
    notes: { type: 'string' },
    styleId: { type: 'string', format: 'uuid', nullable: true },
    styleName: { type: 'string', nullable: true },
    style: { ...bookingStyleSummaryOpenApiSchema, nullable: true },
    styles: {
      type: 'array',
      items: bookingStyleSummaryOpenApiSchema,
      description:
        'All services booked for this appointment (primary style is styles[0] when present)',
    },
    stripePaymentIntentId: { type: 'string', nullable: true },
    paymentAmountCents: { type: 'integer', nullable: true },
    paymentStatus: {
      type: 'string',
      enum: ['UNPAID', 'PARTIAL', 'PAID', 'NOT_REQUIRED'],
    },
    totalDueCents: { type: 'integer', nullable: true },
    amountPaidCents: { type: 'integer', nullable: true },
    outstandingCents: { type: 'integer', nullable: true },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const bookingPaymentIntentResponseOpenApiSchema = {
  type: 'object',
  required: ['clientSecret', 'amountCents', 'currency'],
  properties: {
    clientSecret: { type: 'string' },
    amountCents: { type: 'integer' },
    currency: { type: 'string', enum: ['zar'] },
  },
};

export const bookingOccupancySlotOpenApiSchema = {
  type: 'object',
  required: ['slotStart', 'byStyleId'],
  properties: {
    slotStart: {
      type: 'string',
      description: 'UTC ISO start of configured booking grid slot',
    },
    byStyleId: {
      type: 'object',
      additionalProperties: { type: 'integer', minimum: 0 },
      description:
        'PENDING+CONFIRMED booking counts per style id for this slot',
    },
  },
};

export const bookingOccupancyResponseOpenApiSchema = {
  type: 'object',
  required: ['slots'],
  properties: {
    slots: {
      type: 'array',
      items: bookingOccupancySlotOpenApiSchema,
    },
  },
};

export const styleResponseOpenApiSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'description',
    'imageUrl',
    'sortOrder',
    'isActive',
    'priceCents',
    'durationMinutes',
    'category',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    imageUrl: { type: 'string', nullable: true },
    sortOrder: { type: 'integer' },
    isActive: { type: 'boolean' },
    priceCents: { type: 'integer', nullable: true },
    durationMinutes: {
      type: 'integer',
      nullable: true,
      description:
        'Service duration in minutes; defaults to site session length when null',
    },
    category: {
      type: 'string',
      enum: ['men', 'women', 'kids'],
      description: 'Salon catalog segment',
    },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const teamMemberResponseOpenApiSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'role',
    'imageUrl',
    'sortOrder',
    'isActive',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    role: { type: 'string' },
    imageUrl: { type: 'string', nullable: true },
    sortOrder: { type: 'integer' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const gallerySlideResponseOpenApiSchema = {
  type: 'object',
  required: [
    'id',
    'imageUrl',
    'alt',
    'sortOrder',
    'isActive',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    imageUrl: { type: 'string' },
    alt: { type: 'string' },
    sortOrder: { type: 'integer' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const httpErrorOpenApiSchema = {
  type: 'object',
  required: ['statusCode', 'message', 'error', 'path'],
  properties: {
    statusCode: { type: 'integer', example: 400 },
    message: {
      oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    },
    error: { type: 'string', example: 'Bad Request' },
    path: { type: 'string', example: '/api/v1/orders' },
    code: { type: 'string', description: 'Optional application error code' },
  },
};
