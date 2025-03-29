import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Payer } from "./payer.entity";
import { Billing } from "./billing.entity";
import { Operator } from "./operator.entity";
import { BankAccount } from "./bank_account.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar')
    name: string;

    @Column('varchar',{
        select:false
    })
    password: string;

    @Column('varchar')
    email: string;

    @Column('boolean',{
        default:true
    })
    status: boolean;

    @Column('int',{
        default:2
    })
    role: number;

    @Column('varchar')
    phone: string;

    @Column('varchar')
    ruc: string;

    //COMPANY DATA
    @Column('varchar')
    company_name: string;

    @Column('varchar')
    social_sector: string;

    @Column('varchar')
    annual_income: string;

    @Column('varchar')
    name_r: string;

    @Column('varchar')
    position: string;

    @Column('boolean',{
        default:1
    })
    typeDocument: boolean;

    @Column('varchar')
    document: string;

    @Column('varchar')
    email_r: string;

    @Column('boolean',{
        default:0
    })
    pep: boolean;

    @Column('varchar',{
        default:'0'
    })
    terms_conditions: string;

    @Column('varchar')
    resetpass: string;

    @Column('varchar')
    validity: string;

    @Column('varchar')
    bank_acc: string;

    @Column('varchar')
    bank_name: string;

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    createdAt:Date;

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    updatedAt:Date;

    @Column('timestamp',{
        nullable:true
    })
    reset_token:Date;

    @OneToMany(() => Payer, payer => payer.user)
    payer: Payer[];

    @OneToMany(() => Billing, billing => billing.user)
    billing: Billing[];

    @ManyToOne(() => Operator, operator => operator.user)
    operator: Operator;

}
