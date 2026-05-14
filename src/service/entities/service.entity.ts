import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "../../category/entities/category.entity";

@Entity()
export class Service {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    description!: string;

    @Column({nullable: true})
    logo!: string;


    @Column({type: 'boolean', default: true})
    is_active!: boolean;

    @CreateDateColumn({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    createdAt!: Date;

    @ManyToMany(() => Category,(categorie) => categorie.services)
    @JoinTable()
    categories!: Category[];
}
