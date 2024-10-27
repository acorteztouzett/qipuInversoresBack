import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccount } from '../auth/entities/bank_account.entity';
import { Repository } from 'typeorm';
import { Investor } from '../auth/entities/investor.entity';

@Injectable()
export class BankService {

  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccRepository: Repository<BankAccount>,
    @InjectRepository(Investor)
    private readonly investorRepository: Repository<Investor>
  ){}

  create(token:string, createBankDto: CreateBankDto) {
    return 'This action adds a new bank';
  }

  async findAll(token:string) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});
      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const accounts = await this.bankAccRepository.find({where:{investor: investor}});
      
      return accounts;
    } catch (error) {
      return this.handleErrors(error,'findAll')
    }
  }

  findOne(token:string, id: number) {
    return `This action returns a #${id} bank`;
  }

  update(token:string, id: number, updateBankDto: UpdateBankDto) {
    return `This action updates a #${id} bank`;
  }

  remove(token:string, id: number) {
    return `This action removes a #${id} bank`;
  }

  private handleErrors(error: any,type:string):never{

    throw new InternalServerErrorException(`Something went wrong at ${type}`)
  }
}
