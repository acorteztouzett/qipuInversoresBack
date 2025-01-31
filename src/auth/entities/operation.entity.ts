import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Billing } from "./billing.entity";
import { Payer } from "./payer.entity";
import { MyInvestment } from "./my_investments.entity";

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

    @Column('varchar')
    auction_close_date: string;

    @Column('bool',{
        default: false
    })
    available_to_invest: boolean;

    @Column('float')
    monthly_rate: number;

    @Column('double')
    progress: number;

    @Column('varchar')
    payment_date: string;

    @Column('decimal',
        {
            precision: 19,
            scale: 2
        }
    )
    financed_amount: number;

    @Column('decimal',
        {
            precision: 19,
            scale: 2
        }
    )
    amount_to_finance: number;

    @Column('varchar')
    currency: string;

    @OneToMany(() => Billing, billing => billing.operation)
    billing: Billing[];

    @ManyToOne(() => Payer, payer => payer.operation)
    payer: Payer;

    @OneToMany(() =>MyInvestment, myInvestment => myInvestment.investment)
    myInvestments: MyInvestment[];
    
}