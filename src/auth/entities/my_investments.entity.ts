import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Investor } from "./investor.entity";
import { Operation } from "./operation.entity";


@Entity('my_investments')
export class MyInvestment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Investor, (investor) => investor.myInvestments)
  investor: Investor;

  @ManyToOne(() => Operation, (investment) => investment.myInvestments)
  investment: Operation;

}