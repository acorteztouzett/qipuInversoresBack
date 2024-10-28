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

  async create(token:string, createBankDto: CreateBankDto) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = this.bankAccRepository.create(createBankDto);
      account.investor = investor;
      await this.bankAccRepository.save(account);

      return {message:'Bank account created successfully'};
      
    } catch (error) {
      return this.handleErrors(error,'create')
    }
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

  async update(token:string, id: string, updateBankDto: UpdateBankDto) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});
      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = await this.bankAccRepository.findOne({where:{id:id, investor: investor}});
      if(!account){
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.bankAccRepository.update(account.id,updateBankDto);

      return {message:'Bank account updated successfully'};
    } catch (error) {
      return this.handleErrors(error,'update')
    }
  }

  async remove(token:string, id: string) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});
      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = await this.bankAccRepository.findOne({where:{id:id, investor: investor}});

      if(!account){
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.bankAccRepository.remove(account);
      return {message:'Bank account deleted successfully'}

    } catch (error) {
      return this.handleErrors(error,'remove')
    }
  }

  private handleErrors(error: any,type:string):never{

    throw new InternalServerErrorException(`Something went wrong at ${type}`)
  }
}
