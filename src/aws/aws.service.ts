import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException, Header } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Repository } from 'typeorm';
import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { readFile, unlink } from 'fs/promises';

@Injectable()
export class AwsService {
  private readonly awsUrl=process.env.AWSURL;
  private s3 = new S3Client({
    region:process.env.AWS_S3_REGION,
    credentials:{
        accessKeyId:process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_S3_SECRET_ACCESS_KEY
    }
})
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async listFiles(token: string) {
    
    const user = await this.userRepository.findOne({ where: { id: token } });
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userRuc = user.ruc;
    const params = {
      Bucket: process.env.AWSBUCKET,
      Prefix: `${userRuc}`,
    };

    try {
      const data = await this.s3.send(new ListObjectsV2Command(params));
      
      const links = data.Contents.map((item) => {
        const type = item.Key.replace("/", " ").split(" ");
        return {
          type: type[1],
          file: `${this.awsUrl}/${item.Key}`, 
        };
      });

      return links;
    } catch (err) {
      throw new BadRequestException(`Error fetching files: ${err.message}`);
    }
  }

  async uploadFile(token: string, file: Express.Multer.File, type: string) {
    const user = await this.userRepository.findOne({ where: { id: token } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userRuc = user.ruc ? user.ruc: user.document;

    const {mimetype,buffer} = file;
    // Parámetros para S3
    const params = {
      Bucket: process.env.AWSBUCKET,
      Key: `${userRuc}/${type}`,
      Body: buffer,
      ContentType: mimetype,
    };

    try {
      const upload= new PutObjectCommand(params);

      const result = await this.s3.send(upload);
      
      return { msg: 'uploaded successfully', link: result };
    } catch (err) {
      throw new BadRequestException(`Error uploading file: ${err}`);
    }
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