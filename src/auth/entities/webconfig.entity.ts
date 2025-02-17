import { GeneralStatus } from "src/utils/enums/general-status.enums";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('webconfig')
export class WebConfig {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('varchar')
    name: string;

    @Column('int')
    value: number;

    @Column('varchar')
    description: string;

    @Column('int')
    type: number;

    @Column('timestamp', { 
        default: () => 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    created_at: Date;

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    updatedAt:Date;

    @Column('varchar',{
            default: GeneralStatus.ACTIVE
        }
    )
    status: string;
}