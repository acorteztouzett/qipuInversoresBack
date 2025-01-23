import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Investor } from "./investor.entity";
import { DocsStatus } from '../../aws/interfaces/docs-status.interface';

@Entity('documentation')
export class Documentation{
    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column('varchar')
    documentType: string;

    @Column('varchar')
    url:string

    @Column('varchar',{
        default:DocsStatus["En Revisión"]
    })
    status: DocsStatus;

    @Column('varchar',{
        default: "-"
    })
    statement_funds: string;

    @Column('timestamp',{
        default:()=> 'CURRENT_TIMESTAMP - INTERVAL 5 HOUR'
    })
    createdAt:Date;

    @ManyToOne(() =>Investor, investor => investor.documentation)
    investor: Investor;
}