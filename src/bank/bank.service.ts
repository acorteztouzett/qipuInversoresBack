import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccount } from '../auth/entities/bank_account.entity';
import { Repository } from 'typeorm';
import { Investor } from '../auth/entities/investor.entity';
import { SearchTransactionDto } from './dto/search-transaction.dto';
import { Transaction } from '../auth/entities/transaction.entity';
import { Wallet } from '../auth/entities/wallet.entity';

@Injectable()
export class BankService {

  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccRepository: Repository<BankAccount>,
    @InjectRepository(Investor)
    private readonly investorRepository: Repository<Investor>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
  ){}

  async create(token:string, createBankDto: CreateBankDto) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const checkBanAcc= await this.checkIfBankAccExistsBeforeCreate(token,createBankDto.currency);

      if(checkBanAcc){
        throw new UnauthorizedException(`Bank account with ${createBankDto.currency} currency already exists`);
      }

      const account = this.bankAccRepository.create({
        bank_acc: createBankDto.accountNumber,
        holder: createBankDto.holder,
        bank_name: createBankDto.bankName,
        cci: createBankDto.cci,
        currency: createBankDto.currency,
        status: createBankDto.status,
        type_account: createBankDto.typeAccount,
        investor: investor
      });
      await this.bankAccRepository.save(account);

      const wallet = this.walletRepository.create({
        balance: 0,
        currency: createBankDto.currency,
        bank_account: account
      })

      await this.walletRepository.save(wallet);

      return {message:'Bank account created successfully'};
      
    } catch (error) {
      console.log(error)
      return this.handleErrors(error,'create')
    }
  }

  async checkIfBankAccExistsBeforeCreate(token:string, currency:string){
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = await this.bankAccRepository.findOne({
        where:{
          investor:{
            user_id:investor.user_id
          },
          currency:currency}
      });

      if(account){
        return true;
      }

      return false;
    } catch (error) {
      return this.handleErrors(error,'checkBankAccBeforeCreate')
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
      return this.handleErrors(error,'findAll')
    }
  }

  async update(token:string, id: string, updateBankDto: UpdateBankDto) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});
      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = await this.bankAccRepository.findOne({
        where:{id:id, investor: {
          user_id: investor.user_id
        }}
      });
      if(!account){
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.bankAccRepository.update(account.id,{
        bank_acc: updateBankDto.accountNumber,
        holder: updateBankDto.holder,
        bank_name: updateBankDto.bankName,
        cci: updateBankDto.cci,
        currency: updateBankDto.currency,
        status: updateBankDto.status,
        type_account: updateBankDto.typeAccount
      });

      return {message:'Bank account updated successfully'};
    } catch (error) {
      console.log(error)
      return this.handleErrors(error,'update')
    }
  }

  async remove(token:string, id: string) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});
      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = await this.bankAccRepository.findOne({
        where:{id:id, investor: {
          user_id: investor.user_id
        }}
      });

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

      const bankAcc= await this.bankAccRepository.findOne({
        where:{investor: {
          user_id: investor.user_id
          },
          currency:searchTransactionDto.currency
      }
      });

      const account = await this.walletRepository.findOne({
        where:{ 
          currency:searchTransactionDto.currency, 
          bank_account: {
            id: bankAcc.id
          },
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

      const account = await this.walletRepository.findOne({
        where:{ 
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

    if(error instanceof UnauthorizedException){
      throw new UnauthorizedException(error.message)
    }

    throw new InternalServerErrorException(`Something went wrong at ${type}`)
  }
}
