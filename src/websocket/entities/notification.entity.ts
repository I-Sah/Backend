import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({type: 'int', nullable: true })
  userId!: number |null; // ID du destinataire

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

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' }) // Fait le lien avec la colonne userId ci-dessus
  user!: User;
}