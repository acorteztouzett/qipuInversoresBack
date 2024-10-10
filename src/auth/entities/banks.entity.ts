import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('banks')
export class Banks {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar')
    name: string;

}