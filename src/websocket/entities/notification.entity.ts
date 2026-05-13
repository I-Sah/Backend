import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: string; // ID du destinataire

  @Column()
  type!: string; // 'mention', 'message', etc.

  @Column()
  title!: string;

  @Column('text')
  body!: string;

  @Column({ default: false })
  read!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  timestamp!: Date;
}