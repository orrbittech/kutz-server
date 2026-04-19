import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { OrderStatusValue } from '../../domain/enums';

@Entity({ name: 'orders' })
@Index(['clerkUserId'])
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 128 })
  clerkUserId!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: OrderStatusValue;

  @Column({ type: 'int', default: 0 })
  totalCents!: number;

  @Column({ type: 'jsonb' })
  lineItems!: { name: string; quantity: number; unitPriceCents: number }[];

  @Column({ name: 'notesEncrypted', type: 'text', default: '' })
  notes!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
