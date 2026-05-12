import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../user/entities/user.entity";
import { Chat } from "./chat.entity";

@Entity()
export class Conversation {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @CreateDateColumn({
        type: 'timestamptz', 
        default: () => 'CURRENT_TIMESTAMP'
    })
    createdAt!: Date;

    @ManyToOne(() => User, (user) => user.conversations)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @OneToMany(() => Chat, (chat) => chat.conversation)
    chats!: Chat[];
}