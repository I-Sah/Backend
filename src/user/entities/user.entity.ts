import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum UserRole {
  USER = 'user',
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

  @Column({ nullable: true }) 
  password!: string;

  @Column({ default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'text', nullable: true })
  refreshToken!: string | null; 
}