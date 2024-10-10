import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Operation } from "./operation.entity";
import { Payer } from "./payer.entity";

@Entity('billings')
export class Billing {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar')
    billing_id: string;

    @Column('varchar')
    amount: string;

    @Column('varchar')
    detraction: string;

    @Column('varchar')
    net_amount: string;

    @Column('varchar')
    account: string;

    @Column('varchar')
    date_emission: string;

    @Column('varchar',{
        default:null,
        nullable:true
    })
    status: string;

    @Column('varchar')
    date_payment: string;

    @Column('varchar')
    n_days: string;
    
    @Column('varchar')
    monthly_fee: string;

    @Column('varchar')
    commission: string;

    @Column('varchar')
    partner: string;

    @Column('varchar')
    first_payment: string;

    @Column('varchar')
    second_payment: string;

    @Column('varchar')
    commercial: string;

    @Column('varchar')
    n_commercial_qipu: string;

    @Column('varchar')
    bank_name: string;

    @Column('varchar')
    date_payout: string;

    @Column('varchar')
    pdfLink: string;

    @Column('varchar')
    xmlLink: string;

    @Column('varchar')
    date_expiration: string;

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    createdAt:Date;

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    updatedAt:Date;

    @ManyToOne(() => User, user => user.billing)
    user: User;

    @ManyToOne(() => Operation, operation => operation.billing)
    operation: Operation;

    @ManyToOne(() => Payer, payer => payer.billing)
    payer: Payer;
}