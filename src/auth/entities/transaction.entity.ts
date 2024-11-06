import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Wallet } from "./wallet.entity";
import { BankAccount } from "./bank_account.entity";

@Entity('transactions')
export class Transaction{

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar')
    type_movement: string;

    @Column('varchar')
    status: string;

    @Column('decimal',
        {
            precision: 19,
            scale: 4
        }
    )
    amount: number;

    @Column('varchar')
    bank_operation_code: string;

    @Column('varchar')
    auction_code: string;

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    createdAt:Date;

    @Column('varchar')
    currency: string;

    @Column('varchar')
    voucher: string;

    @Column('varchar')
    destination_account: string;

    @Column('varchar')
    charge_account: string;

    @ManyToOne(() => Wallet, wallet => wallet.transactions)
    wallet: Wallet;

}