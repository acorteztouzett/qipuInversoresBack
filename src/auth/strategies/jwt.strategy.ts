import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { Injectable } from '@nestjs/common';
import { Investor } from "../entities/investor.entity";
import { JwtPayload } from "../interfaces/jwt-interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){

    constructor(
        @InjectRepository(Investor)
        private readonly userRepository: Repository<Investor>,
        configService:ConfigService
    ){
        super({
            secretOrKey:configService.get('JWT_SECRET'),
            jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
        })
    }

    async validate(payload:JwtPayload):Promise<Investor>{
        const {user_id}=payload;
        const user=await this.userRepository.findOneBy({user_id});

        if(!user)throw new UnauthorizedException('Invalid token');
        if(user.status!==0)throw new UnauthorizedException('User is not active');

        return user;
    }
}