import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Service } from "../../service/entities/service.entity";

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    name!: string;

    @Column({type: 'boolean', default: true})
    isActive!: Boolean

    @ManyToMany(() => Service, (service) => service.categories)
    services!: Service[];
}
