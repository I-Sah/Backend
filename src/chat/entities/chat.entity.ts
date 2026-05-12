import { Column, CreateDateColumn, Entity, IsNull, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../user/entities/user.entity";
import { Conversation } from "./conversation.entity";

@Entity('chats')
export class Chat {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({type: 'enum',enum: ['user','assistant','system']})
    role!: MessageRole;

    @Column()
    message!: string;

    @Column({
    default: 'completed'
    })
    status!: 'pending' | 'completed' | 'failed';

    @Column({ 
        type: 'timestamptz', 
        default: () => 'CURRENT_TIMESTAMP' 
    })
    createdAt!: Date;

    @UpdateDateColumn({ 
        type: 'timestamp', 
        default: () => 'CURRENT_TIMESTAMP()', 
        onUpdate: 'CURRENT_TIMESTAMP()' 
    })
    updatedAt!: Date;

    @ManyToOne(() => Conversation, (conversation) => conversation.chats, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'conversation_id' })
    conversation!: Conversation;
}

export type MessageRole = 'user' | 'assistant' | 'system';