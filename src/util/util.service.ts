import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Banks } from '../auth/entities/banks.entity';
import { GeneralStatus } from '../utils/enums/general-status.enums';
import { Risk } from '../auth/entities/risk.entity';

@Injectable()
export class UtilService {
  constructor(
    private readonly entityManager: EntityManager,
    @InjectRepository(Banks)
    private readonly banksRepository: Repository<Banks>,
    @InjectRepository(Risk)
    private readonly riskRepository: Repository<Risk>
  ) {}

  async getDepartments() {
    try {
      const results= await this.entityManager.query('SELECT * FROM departments');
      return results;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getProvinces(id: string) {
    try {
      const results = await this.entityManager.query('SELECT * FROM provinces WHERE department_id = ?', [id]);
      return results;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getDistricts(id: string) {
    try {
      const results = await this.entityManager.query('SELECT * FROM districts WHERE province_id = ?', [id]);
      return results;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getBanks() {
    try {
      const results = await this.banksRepository.find({
        where: {
          status: GeneralStatus.ACTIVE
        },
        select: ['id', 'name']
      });
      return results;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getRisk() {
    try {
      const results = await this.riskRepository.find();
      return results;
    } catch (error) {
      throw new Error(error);
    }
  }
}
