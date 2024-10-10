import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Investor } from "./investor.entity";

@Entity('documentation')
export class Documentation{
    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column('varchar')
    documentType: string;

    @Column('varchar')
    url:string

    @Column('varchar',{
        default:'En revisión'
    })
    status:string

    @ManyToOne(() =>Investor, investor => investor.documentation)
    investor: Investor;
}