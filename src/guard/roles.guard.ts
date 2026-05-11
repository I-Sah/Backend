import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";

@Injectable()
export class RolesGuard implements CanActivate{
    constructor(private reflector: Reflector){}

    canActivate(context: ExecutionContext): boolean{
        const rolesRequis = this.reflector.get<string[]>('roles', context.getHandler());
        if (!rolesRequis) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        return rolesRequis.some(role => user.role?.includes(user.role));    
    }
}