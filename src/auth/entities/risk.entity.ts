import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Payer } from './payer.entity';


@Entity('risk')
export class Risk {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('varchar')
    name: string;

    @Column('varchar')
    description: string;

    @Column('varchar')
    color: string;

    @OneToMany(() => Payer, payer => payer.risk)
    payer: Payer[];
}