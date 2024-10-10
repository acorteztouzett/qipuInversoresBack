import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Investor } from "./investor.entity";

@Entity('wallet')
export class Wallet {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column('varchar')
    balance: string;

    @Column('varchar')
    currency: string;

    @ManyToOne(() =>Investor, investor => investor.wallets)
    investor: Investor;

}