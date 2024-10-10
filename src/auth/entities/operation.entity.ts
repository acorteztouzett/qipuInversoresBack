import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Billing } from "./billing.entity";
import { Payer } from "./payer.entity";

@Entity('operations')
export class Operation{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar')
    n_operation: string;

    @Column('varchar')
    name: string;

    @Column('varchar',{
        default: "En Proceso"
    })
    status: string;

    @OneToMany(() => Billing, billing => billing.operation)
    billing: Billing;

    @ManyToOne(() => Payer, payer => payer.operation)
    payer: Payer;
}