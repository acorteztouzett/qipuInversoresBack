import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./user.entity";
import { Risk } from "./risk.entity";
import { Billing } from "./billing.entity";
import { Operation } from "./operation.entity";


@Entity('payers')
export class Payer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar')
    ruc: string;

    @Column('varchar')
    full_name: string;

    @Column('varchar')
    email: string;

    @Column('varchar',{
        nullable: true
    })
    email_extra: string;

    @Column('varchar')
    phone: string;

    @Column('varchar')
    name_debtor: string;

    @Column('varchar',{
        default: "pending"
    })
    status: string;

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    createdAt:Date;

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    updatedAt:Date;

    @Column('varchar')
    description: string;

    @Column('varchar')
    sector: string;

    @Column('varchar',{
        nullable: true
    })
    field: string;

    @Column('varchar',{
        nullable: true
    })
    historic_arrear: string;

    @Column('varchar',{
        nullable: true
    })
    six_month_arrear: string;

    @ManyToOne(() => User, user => user.payer)
    user: User;

    @ManyToOne(() =>Risk, risk => risk.payer)
    risk: Risk;

    @ManyToOne(() => Billing, billing => billing.payer)
    billing: Billing;

    @OneToMany(()=> Operation, operation => operation.payer)
    operation: Operation[];
}