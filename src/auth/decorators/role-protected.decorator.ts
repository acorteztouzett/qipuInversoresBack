import { SetMetadata } from '@nestjs/common';
import { ValidRoles } from '../interfaces/valid-roles';


export const RoleProtected = (...args: ValidRoles[]) => {


    return SetMetadata('roles', args);
}
