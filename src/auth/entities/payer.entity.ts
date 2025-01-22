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

    @Column('varchar',{
        nullable: true
    })
    description: string;

    @Column('varchar',{
        nullable: true
    })
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

    @Column('varchar',{
        nullable: true
    })
    area:   string;

    @Column('varchar',{
        nullable: true
    })
    charge: string;

    @Column('varchar',{
        nullable: true
    })
    phone_d: string;

    @Column('varchar',{
        nullable: true
    })
    area_d: string;

    @Column('varchar',{
        nullable: true
    })
    charge_d: string;

    @Column('varchar',{
        nullable: true
    })
    email_d: string;

    @Column('varchar',{
        nullable: true
    })
    email_extra_d: string;

    @Column('varchar',{
        nullable: true
    })
    full_name_d: string;

    @Column('varchar',{
        nullable: true
    })
    payer_phone_d: string;

    @Column('varchar',{
        nullable: true
    })
    payer_phone: string;

    @ManyToOne(() => User, user => user.payer)
    user: User;

    @ManyToOne(() =>Risk, risk => risk.payer)
    risk: Risk;

    @ManyToOne(() => Billing, billing => billing.payer)
    billing: Billing;

    @OneToMany(()=> Operation, operation => operation.payer)
    operation: Operation[];
}