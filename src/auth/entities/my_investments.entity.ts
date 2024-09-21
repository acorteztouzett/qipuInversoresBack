import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Investor } from "./investor.entity";
import { Investment } from "./investments.entity";


@Entity('my_investments')
export class MyInvestment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Investor, (investor) => investor.myInvestments)
  investor: Investor;

  @ManyToOne(() => Investment, (investment) => investment.myInvestments)
  investment: Investment;

}