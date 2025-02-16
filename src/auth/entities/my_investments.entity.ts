import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Investor } from "./investor.entity";
import { Operation } from "./operation.entity";


@Entity('my_investments')
export class MyInvestment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal',
    {
        precision: 19,
        scale: 2
    }
  )
  invested_amount: number;

  @Column('varchar')
  estimated_profit: string;

  @Column('timestamp',{
    default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
  })
  createdAt:Date;

  @ManyToOne(() => Investor, (investor) => investor.myInvestments)
  investor: Investor;

  @ManyToOne(() => Operation, (investment) => investment.myInvestments)
  investment: Operation;

}