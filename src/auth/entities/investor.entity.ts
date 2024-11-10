import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { eTypeInterest, eTypeUser } from "../interfaces/userInterfaces";
import { ValidRoles } from "../interfaces/valid-roles";
import { InvestorRepresentation } from "./investor_representation.entity";
import { MyInvestment } from "./my_investments.entity";
import { Wallet } from "./wallet.entity";
import { Company } from "./company.entity";
import { Documentation } from "./documentation.entity";
import { BankAccount } from "./bank_account.entity";


@Entity('investors')
export class Investor{
    @PrimaryGeneratedColumn('uuid')
    user_id:string;

    @Column('varchar')
    names:string;

    @Column('varchar')
    surname: string;

    @Column('varchar')
    email: string;

    @Column('varchar')
    phone: string;
    
    @Column('varchar')
    user_type: eTypeUser

    @Column('varchar')
    interest_type: eTypeInterest

    @Column('varchar',{
        select: false
    })
    password: string;

    @Column('varchar')
    document_type: string;

    @Column('varchar')
    document: number;

    @Column('boolean')
    pep: boolean;

    @Column('varchar')
    address: string;

    @Column('json')
    department: object;

    @Column('json')
    province: object;

    @Column('json')
    district: object;

    @Column('varchar')
    country: string;

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    createdAt:Date;

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    updatedAt:Date;

    @Column('varchar',{
        default: 'User'
    })
    roles: ValidRoles

    @Column('int',{
        default: 1
    })
    status: number;

    @Column('varchar')
    statement_funds: string;

    @Column('bool')
    terms_conditions: boolean;

    @Column('varchar')
    charge: string;

    @OneToMany(() =>Company, company=>company.investor)
    company: Company[];

    @OneToMany(()=>InvestorRepresentation, investorRepresentation=>investorRepresentation.investor)
    investorRepresentation: InvestorRepresentation[];

    @OneToMany(() => MyInvestment, (myInvestment) => myInvestment.investor)
    myInvestments: MyInvestment[];


    @OneToMany(() => Documentation, documentation => documentation.investor)
    documentation: Documentation[];

    @OneToMany(() =>BankAccount, bank_account => bank_account.investor)
    bank_accounts: BankAccount[];
}
