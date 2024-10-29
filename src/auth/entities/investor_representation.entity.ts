import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Investor } from "./investor.entity";


@Entity('investors_representation')
export class InvestorRepresentation{
    @PrimaryGeneratedColumn('uuid')
    representation_id:string;

    @Column('varchar')
    names: string;

    @Column('varchar')
    surname: string;

    @Column('varchar')
    document_type: string;

    @Column('varchar')
    document: number;

    @Column('varchar')
    email: string;

    @Column('varchar')
    charge: string;

    @Column('boolean')
    isPep: boolean;

    @Column('int',{
        default: 1
    })
    status: number;

    @ManyToOne(() => Investor, (investor) => investor.investorRepresentation)
    investor: Investor;
}