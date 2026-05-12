import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Chat } from '../../chat/entities/chat.entity';
import { Conversation } from '../../chat/entities/conversation.entity';

export enum UserRole {
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  pseudo!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'varchar', nullable: true }) 
  password!: string | null;

  @Column({ default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'text', nullable: true })
  refreshToken!: string | null; 

  @OneToMany(() => Conversation , (conversation) => conversation.user)
  conversations!: User
}