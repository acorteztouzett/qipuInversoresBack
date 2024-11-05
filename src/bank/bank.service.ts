import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccount } from '../auth/entities/bank_account.entity';
import { Repository } from 'typeorm';
import { Investor } from '../auth/entities/investor.entity';
import { SearchTransactionDto } from './dto/search-transaction.dto';
import { Transaction } from '../auth/entities/transaction.entity';

@Injectable()
export class BankService {

  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccRepository: Repository<BankAccount>,
    @InjectRepository(Investor)
    private readonly investorRepository: Repository<Investor>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>
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

      const accounts = await this.bankAccRepository.find({
        where: { investor: { user_id: investor.user_id } },
      });
      
      return accounts;
    } catch (error) {
      console.log(error)
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

  async findTransactions(token:string, searchTransactionDto: SearchTransactionDto) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = await this.bankAccRepository.findOne({
        where:{ 
          currency:searchTransactionDto.currency, investor: investor,
          transactions: {
            type_movement: searchTransactionDto.transactionType? searchTransactionDto.transactionType: null,
            status: searchTransactionDto.status? searchTransactionDto.status: null,
            createdAt: searchTransactionDto.operationDate? new Date(searchTransactionDto.operationDate): null
          }
        },
        relations:['transactions']
      });

      return account;
    } catch (error) {
      console.log(error)
      return this.handleErrors(error,'findTransactions')
    }
  }

  async findOneTransaction(token:string, id: string) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = await this.bankAccRepository.findOne({
        where:{ 
          investor: investor,
          transactions: {
            id: id
          }
        },
        relations:['transactions']
      });

      return account;
    } catch (error) {
      return this.handleErrors(error,'findOneTransaction')
    }
  }

  async deposit(token:string){

  }

  async withdraw(token:string){

  }
  private handleErrors(error: any,type:string):never{

    throw new InternalServerErrorException(`Something went wrong at ${type}`)
  }
}
