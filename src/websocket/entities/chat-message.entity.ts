import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('chat_messages')
export class ChatMessageEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  senderId!: string;

  @Column()
  senderName!: string;

  @Column()
  room!: string;

  @Column('text')
  content!: string;

  @CreateDateColumn({ type: 'timestamp' })
  timestamp!: Date;
}