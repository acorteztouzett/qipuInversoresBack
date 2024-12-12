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
            scale: 2    
        }
    )
    balance: number;

    @Column('decimal',
        {
            precision: 19,
            scale: 2
        }
    )
    reserved_balance: number;

    @Column('decimal',
        {
            precision: 19,
            scale: 2
        }
    )
    invested_balance: number;

    @Column('varchar')
    currency: string;

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    createdAt:Date;

    @ManyToOne(() => Investor, investor => investor.wallet)
    investor: Investor;

    @ManyToOne(() => BankAccount, bankAccount => bankAccount.wallets)
    bank_account: BankAccount;

    @OneToMany(() => Transaction, transaction => transaction.wallet)
    transactions: Transaction[];
}