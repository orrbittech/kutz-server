import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'styles' })
@Index('idx_styles_active_sort_order', ['isActive', 'sortOrder'])
export class StyleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', nullable: true })
  priceCents!: number | null;

  /** Service duration in minutes; defaults to site booking session when null. */
  @Column({ type: 'int', nullable: true })
  durationMinutes!: number | null;

  /** Salon catalog segment */
  @Column({ type: 'varchar', length: 16, default: 'men' })
  category!: 'men' | 'women' | 'kids';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
