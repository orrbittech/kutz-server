import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'site_settings' })
export class SiteSettingsEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 256, default: 'Kutz' })
  businessName!: string;

  @Column({ type: 'varchar', length: 512, default: '' })
  addressLine1!: string;

  @Column({ type: 'varchar', length: 128, default: '' })
  city!: string;

  @Column({ type: 'varchar', length: 64, default: '' })
  region!: string;

  @Column({ type: 'varchar', length: 32, default: '' })
  postalCode!: string;

  @Column({ type: 'varchar', length: 64, default: 'US' })
  country!: string;

  @Column({ type: 'varchar', length: 64, default: '' })
  phone!: string;

  @Column({ type: 'varchar', length: 256, default: '' })
  publicEmail!: string;

  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  /** JSON array of strings e.g. Mo-Su 07:00-20:00 for schema.org */
  @Column({ type: 'text', default: '[]' })
  openingHoursSpecJson!: string;

  /** IANA timezone for booking slot boundaries (e.g. Africa/Johannesburg). */
  @Column({ type: 'varchar', length: 64, default: 'Africa/Johannesburg' })
  bookingTimeZone!: string;

  /**
   * JSON: BookingHoursSpec — rules with daysOfWeek (JS: 0=Sun..6=Sat), open/close "HH:mm".
   * Default seeded by migration / service when empty.
   */
  @Column({ type: 'text', default: '[]' })
  bookingHoursSpecJson!: string;

  @Column({ type: 'varchar', length: 16, default: 'en' })
  defaultLocale!: string;

  @Column({ type: 'text', default: '{}' })
  themeJson!: string;

  @Column({ type: 'boolean', default: true })
  smsBookingNotificationsEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  emailBookingNotificationsEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  smsBookingRemindersEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  emailBookingRemindersEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  smsThankYouReceiptEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  emailThankYouReceiptEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  smsPaymentConfirmedEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  emailPaymentConfirmedEnabled!: boolean;

  /** Wall-clock length of one bookable session block (minutes). */
  @Column({ type: 'int', default: 15 })
  bookingSessionMinutes!: number;

  /** Buffer between sessions (cleaning, turnover) in minutes. */
  @Column({ type: 'int', default: 10 })
  bookingBreakMinutes!: number;

  /** Max concurrent bookings per slot start, counted per service (style). */
  @Column({ type: 'int', default: 5 })
  bookingConcurrentSeatsPerSlot!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
