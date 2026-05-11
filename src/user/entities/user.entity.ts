import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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
}