import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Investor } from "./investor.entity";
import { Transaction } from "./transaction.entity";
import { Wallet } from "./wallet.entity";

@Entity('bank_account')
export class BankAccount{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar')
    holder: string;

    @Column('varchar')
    type_account: string;

    @Column('varchar')
    bank_name: string;

    @Column('varchar')
    bank_acc: string;

    @Column('varchar')
    currency: string;

    @Column('varchar')
    cci: string;

    @Column('varchar',
    {default: 'En revisión'}
    )
    status: string;

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    createdAt:Date;

    @ManyToOne(() => Investor, user => user.bank_accounts)
    investor: Investor;

    @OneToMany(() => Wallet, wallet => wallet.bank_account)
    wallets: Wallet[];
}