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

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    createdAt:Date;

    @Column('bool',{
        default: false
    })
    available_to_invest: boolean;

    @OneToMany(() => Billing, billing => billing.operation)
    billing: Billing;

    @ManyToOne(() => Payer, payer => payer.operation)
    payer: Payer;

    
}