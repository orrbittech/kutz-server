import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookingStyleEntity } from './booking-style.entity';
import type { BookingPaymentStatusValue, BookingStatusValue } from '../../domain/enums';
import { StyleEntity } from './style.entity';

@Entity({ name: 'bookings' })
@Index(['clerkUserId'])
@Index(['scheduledAt'])
export class BookingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 128 })
  clerkUserId!: string;

  @Column({ type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ type: 'varchar', length: 32 })
  status!: BookingStatusValue;

  @Column({ type: 'varchar', length: 24, default: 'NOT_REQUIRED' })
  paymentStatus!: BookingPaymentStatusValue;

  /** Sum of style prices (ZAR cents) when booking was last priced. */
  @Column({ type: 'integer', nullable: true })
  totalDueCents!: number | null;

  /** Cumulative amount successfully charged (ZAR cents). */
  @Column({ type: 'integer', nullable: true })
  amountPaidCents!: number | null;

  @ManyToOne(() => StyleEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'styleId' })
  style!: StyleEntity | null;

  @OneToMany(() => BookingStyleEntity, (bs) => bs.booking)
  bookingStyles!: BookingStyleEntity[];

  /** Plain-text notes; DB column name kept for compatibility */
  @Column({ name: 'notesEncrypted', type: 'text', default: '' })
  notes!: string;

  @Column({ type: 'timestamptz', nullable: true })
  reminder1hSentAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  reminder15mSentAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  thankYouSentAt!: Date | null;

  /** Short human-readable reference for SMS/email and in-shop confirmation. */
  @Column({ type: 'varchar', length: 12, nullable: true, unique: true })
  bookingCode!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  stripePaymentIntentId!: string | null;

  /** Comma-separated Stripe PaymentIntent ids already applied to amountPaidCents (webhook idempotency). */
  @Column({ type: 'varchar', length: 2048, default: '' })
  stripeSucceededPaymentIntentIds!: string;

  /** Snapshot of last PaymentIntent amount (ZAR cents) when created or confirmed */
  @Column({ type: 'integer', nullable: true })
  paymentAmountCents!: number | null;

  /** Set after customer payment confirmation SMS/email sent (idempotent webhook). */
  @Column({ type: 'timestamptz', nullable: true })
  paymentConfirmationSentAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
