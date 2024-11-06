import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Investor } from "./investor.entity";
import { Transaction } from "./transaction.entity";
import { BankAccount } from "./bank_account.entity";

@Entity('wallet')
export class Wallet {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column('decimal',
        {
            precision: 19,
            scale: 4
        }
    )
    balance: number;

    @Column('varchar')
    currency: string;

    @ManyToOne(() => BankAccount, bankAccount => bankAccount.wallets)
    bank_account: BankAccount;

    @OneToMany(() => Transaction, transaction => transaction.wallet)
    transactions: Transaction[];
}