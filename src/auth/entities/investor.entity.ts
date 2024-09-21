import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { eTypeInterest, eTypeUser } from "../interfaces/userInterfaces";
import { ValidRoles } from "../interfaces/valid-roles";
import { InvestorRepresentation } from "./investor_representation.entity";
import { MyInvestment } from "./my_investments.entity";


@Entity('investors')
export class Investor{
    @PrimaryGeneratedColumn('uuid')
    user_id:string;

    @Column('varchar')
    names:string;

    @Column('varchar')
    surname: string;

    @Column('varchar',{
        unique:true
    }
    )
    email: string;

    @Column('varchar')
    phone: string;
    
    @Column('varchar')
    user_type: eTypeUser

    @Column('varchar')
    interest: eTypeInterest

    @Column('varchar')
    password: string;

    @Column('varchar')
    document_type: string;

    @Column('varchar')
    document: number;

    @Column('boolean')
    isPep: boolean;

    @Column('varchar')
    address: string;

    //COMPANY DATA
    @Column('varchar')
    type_company_document: string;

    @Column('varchar')
    company_document: number;

    @Column('varchar')
    company_name: string;

    @Column('varchar')
    category: string;

    @Column('varchar')
    operation_type: string;

    @Column('varchar')
    annual_income: string;

    @Column('varchar')
    docs_url: string;

    @Column('varchar',{
        default: 'User'
    })
    roles: ValidRoles

    @Column('int')
    status: number;

    @OneToMany(()=>InvestorRepresentation, investorRepresentation=>investorRepresentation.investor)
    investorRepresentation: InvestorRepresentation[];

    @OneToMany(() => MyInvestment, (myInvestment) => myInvestment.investor)
    myInvestments: MyInvestment[];
}