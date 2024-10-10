import { PartialType } from '@nestjs/swagger';
import { CreateUserDto, RegisterDto } from './create-user.dto';

export class UpdateAuthDto extends PartialType(RegisterDto) {}
