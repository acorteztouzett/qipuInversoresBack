import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Investor } from "./investor.entity";
import { Transaction } from "./transaction.entity";

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

    @OneToMany(() => Transaction, transaction => transaction.wallet)
    transactions: Transaction[];
}