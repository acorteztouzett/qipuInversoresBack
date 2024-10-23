import { Injectable } from '@nestjs/common';
import { CreateUtilDto } from './dto/create-util.dto';
import { UpdateUtilDto } from './dto/update-util.dto';
import { EntityManager } from 'typeorm';

@Injectable()
export class UtilService {
  constructor(private readonly entityManager: EntityManager) {}

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
}
