import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MyInvestment } from "./my_investments.entity";


@Entity('investments')
export class Investment{
    @PrimaryGeneratedColumn('uuid')
    investment_id:string;
 
    @Column('varchar')
    progress:string;
    
    @Column('varchar')
    risk:string;
    
    @Column('varchar')
    auction_close_date:string;
    
    @Column('varchar')
    billing_id:string;

    @OneToMany(() => MyInvestment, (myInvestment) => myInvestment.investment)
    myInvestments: MyInvestment[];
}