import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Investor } from './entities/investor.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interfaces/jwt-interface';
import {compareSync} from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Investor)
    private readonly userRepository: Repository<Investor>,
    private readonly jwtService: JwtService
  ){}
  async create(createUserDto: CreateUserDto) {
    try {
      const {...userData}=createUserDto;
      // const tokenVerification=customAlphabet(this.alphabet,10)();
      const user=this.userRepository.create({
        
      });
      await this.userRepository.save(user);
      // const url= `${process.env.CONFIRMATION_URL}?token=${tokenVerification}` 

      // await this.mailerService.sendMail({
      //   from:process.env.MAIL_USER,
      //   to:user.email,
      //   subject:'Andean Crown SAF ha creado tu cuenta',
      //   html:CreateUserMail(userData.names?userData.names:userData.legalRepresentation,url)
      // })
      return {
        message:'User created successfully',
      };
      
    } catch (error) {
      this.handleErrors(error,'create')
    }
  }

  async login(loginUserDto: LoginUserDto){
    try {
      const{password,email,country}=loginUserDto;

      const user= await this.userRepository.findOne({
        where:{email},
        select:{password:true,user_id:true,status:true}
      });
      
      if(!user){
        throw new UnauthorizedException('Invalid credentials');
      }
      if(!compareSync(password,user.password)){
        throw new UnauthorizedException('Invalid credentials');
      }

      if(user.status!==0){
        throw new UnauthorizedException('User is inactive');
      }

      const response= await this.userRepository.findOne({
        where:{email},
        select:{password:false}
      });

      return {
        ...response,
        token:this.getJwtToken({user_id:user.user_id})
      };

    } catch (error) {
      this.handleErrors(error,'login');
    }
  }

  private getJwtToken(payload: JwtPayload){
    const token=this.jwtService.sign(payload);
    return token;
  }

  private handleErrors(error: any,type:string):never{
    if(error.code==='23505'){
      throw new BadRequestException(`USER already exists`)
    }
    if(error.status===401){
      throw new UnauthorizedException(error.message);
    }
    throw new InternalServerErrorException(`Something went wrong at ${type}`)
  }
}
