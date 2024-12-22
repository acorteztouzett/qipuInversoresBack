import { GeneralStatus } from "src/utils/enums/general-status.enums";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('banks')
export class Banks {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('varchar')
    name: string;

    @Column('varchar',{
            default: GeneralStatus.ACTIVE
        }
    )
    status: string;
}