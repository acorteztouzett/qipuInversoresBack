import { IsEmail, IsEnum, IsString } from "class-validator";
import { eTypeInterest, eTypeUser } from "../interfaces/userInterfaces";

export class CreateUserDto {

    @IsString()
    country: string;

    @IsString()
    name: string;

    @IsString()
    surname: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsString()
    @IsEnum(eTypeUser)
    userType: eTypeUser;

    @IsString()
    @IsEnum(eTypeInterest)
    interestType: eTypeInterest
}
