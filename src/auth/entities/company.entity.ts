import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Investor } from "./investor.entity";

@Entity('company')
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column('varchar')
    company_name: string;

    @Column('varchar')
    type_company_document: string;

    @Column('varchar')
    company_document: number;
    
    @Column('varchar')
    annual_income: string;
    
    @Column('json')
    category: object;

    @Column('varchar')
    operation_type: string;

    @ManyToOne(() => Investor, investor => investor.company)
    investor: Investor;
}