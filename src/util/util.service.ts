import { Injectable } from '@nestjs/common';
import { EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Banks } from '../auth/entities/banks.entity';
import { GeneralStatus, Roles } from '../utils/enums/general-status.enums';
import { Risk } from '../auth/entities/risk.entity';
import { WebConfig } from '../auth/entities/webconfig.entity';
import { User } from '../auth/entities/user.entity';
import { ConfigTypes } from 'src/utils/enums/configTypes.enums';

@Injectable()
export class UtilService {
  constructor(
    private readonly entityManager: EntityManager,
    @InjectRepository(Banks)
    private readonly banksRepository: Repository<Banks>,
    @InjectRepository(Risk)
    private readonly riskRepository: Repository<Risk>,
    @InjectRepository(WebConfig)
    private readonly webConfigRepository: Repository<WebConfig>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async getWebConfig() {
    try {
      const results = await this.webConfigRepository.find({
        where: {
          type: ConfigTypes.WEB_CONFIG,
          status: GeneralStatus.ACTIVE
        },
        select: ['id', 'name', 'value', 'description']
      });
      return results;
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateWebConfig(token:string, value: number){
    try {
      const isAdmin = await this.userRepository.findOne({
        where: {
          id: token,
          role: Roles.ADMIN
        }
      });

      if (!isAdmin) {
        throw new Error('Unauthorized');
      }
      
      const config = await this.webConfigRepository.findOne({
        where: {
          type: ConfigTypes.WEB_CONFIG,
          status: GeneralStatus.ACTIVE
        }
      });
      if (!config) {
        throw new Error('Web config not found');
      }

      this.webConfigRepository.update(config.id, {
        value,
        name: `${value} días`
      });

    } catch (error) {
      throw new Error(error);
    }
  }
}
