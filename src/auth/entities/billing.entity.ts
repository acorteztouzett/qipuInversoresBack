import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Operation } from "./operation.entity";
import { Payer } from "./payer.entity";
import { BillingStatus } from "src/utils/enums/billings.enum";

@Entity('billings')
export class Billing {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar')
    billing_id: string;

    @Column('decimal',
        {
            precision: 19,
            scale: 2
        }
    )
    amount: number;

    @Column('decimal',
        {
            precision: 19,
            scale: 2
        }
    )
    detraction: number;

    @Column('decimal',
        {
            precision: 19,
            scale: 2
        }
    )
    net_amount: number;

    @Column('varchar')
    currency: string;

    @Column('timestamp')
    date_emission: Date;

    @Column('varchar',{
        default:BillingStatus.INPROGRESS,
    })
    status: string;

    @Column('timestamp')
    date_payment: Date;

    @Column('integer',
        {
            nullable:true
        }
    )
    n_days: number;
    
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

    @Column('timestamp')
    date_payout: Date;
    
    @Column('float')
    monthly_rate: number;

    @Column('varchar')
    pdfLink: string;

    @Column('varchar')
    xmlLink: string;

    @Column('varchar',{
        nullable:true,
    })
    documentsustentLink: string;

    @Column('timestamp')
    date_expiration: Date;

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