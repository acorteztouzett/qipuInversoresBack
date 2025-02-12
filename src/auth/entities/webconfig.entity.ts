import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('webconfig')
export class WebConfig {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('varchar')
    name: string;
}