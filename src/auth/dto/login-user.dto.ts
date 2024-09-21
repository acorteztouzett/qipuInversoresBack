import { IsEmail, IsString } from "class-validator";


export class LoginUserDto{

    @IsString()
    country: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}