import { IsNumber, IsOptional, IsString } from "class-validator";
import { DocsStatus } from "../interfaces/docs-status.interface";


export class SearchDocDto {
    
    @IsOptional()
    @IsString()
    registerDate: string;

    @IsOptional()
    @IsString()
    status:DocsStatus;

    @IsOptional()
    @IsNumber()
    page: number;

    @IsOptional()
    @IsNumber()
    limit: number;

    @IsOptional()
    @IsString()
    clientName: string;
}