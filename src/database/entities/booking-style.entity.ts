import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BookingEntity } from './booking.entity';
import { StyleEntity } from './style.entity';

@Entity({ name: 'booking_styles' })
@Index('idx_booking_styles_style_id', ['styleId'])
export class BookingStyleEntity {
  @PrimaryColumn({ type: 'uuid' })
  bookingId!: string;

  @PrimaryColumn({ type: 'uuid' })
  styleId!: string;

  @ManyToOne(() => BookingEntity, (b) => b.bookingStyles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingId' })
  booking!: BookingEntity;

  @ManyToOne(() => StyleEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'styleId' })
  style!: StyleEntity;
}
