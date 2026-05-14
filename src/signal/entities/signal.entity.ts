import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { SignalStatus } from "../enums/signal_status.enum";
import { SignalUrgence } from "../enums/urgence.enum";
import { User } from "../../user/entities/user.entity";

@Entity('signal')
export class Signal {
    @PrimaryGeneratedColumn()
    signal_id! : number; 

    @Column()
    titre! : string;

    @Column({ nullable : true})
    description! : string;

    @Column({ type: 'enum', enum: SignalUrgence, default: SignalUrgence.FAIBLE })
    priority! : SignalUrgence;

    @Column('decimal' , {precision:9 , scale: 6 })
    latitude! : number;

    @Column('decimal' , {precision : 9 , scale : 6 })
    longitude! : number ;

    @Column({nullable : true})
    picture! : string ; 

    @Column({
        type : 'enum',
        enum : SignalStatus ,
        default : SignalStatus.NOUVEAU ,
    })
    signal_status! : SignalStatus;

    @Column()
    categorie_id! : number;

    @Column()
    service_id! : number;

    @Column("boolean")
    anonyme! : boolean;

    @Column('timestamp', { nullable: true })
    created_at! : Date;

    @Column('timestamp', { nullable: true })
    updated_at! : Date;

    @Column('timestamp' , { nullable: true })
    resolu_at! : Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user!: User;
}
