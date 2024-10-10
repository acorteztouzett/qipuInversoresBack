import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('bank_account')
export class BankAccount{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar')
    bank_name: string;

    @Column('varchar')
    bank_acc: string;

    @ManyToOne(() => User, user => user.bank_accounts)
    user: User;
}