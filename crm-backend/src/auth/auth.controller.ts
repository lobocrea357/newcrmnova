import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { RbacService } from '../rbac/rbac.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly rbac: RbacService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { id: string }) {
    return this.auth.me(user.id);
  }

  /* ----------------------- Admin de usuarios ----------------------- */

  /**
   * Autoriza una operación de administración de usuarios según permisos (no solo
   * rol admin): users.create / users.edit / users.delete (o usuarios.*). Sobre otro
   * usuario, además exige rango superior al suyo (canManageRole), salvo super_admin.
   */
  private async authorize(meId: string, perm: 'create' | 'edit' | 'delete', targetId?: string) {
    const ctx = await this.rbac.getCtx(meId);
    if (!this.rbac.hasPerm(ctx, [`users.${perm}`, `usuarios.${perm}`])) {
      throw new ForbiddenException(`Sin permiso users.${perm}`);
    }
    if (!targetId || ctx.isSuperAdmin) return;
    if (targetId === meId) {
      if (perm === 'delete') throw new ForbiddenException('No puedes borrar tu propio usuario');
      return;
    }
    const target = await this.prisma.profiles.findUnique({
      where: { id: targetId },
      select: { roles: { select: { ranking: true } } },
    });
    if ((target?.roles?.ranking ?? 0) >= ctx.ranking) {
      throw new ForbiddenException('No puedes gestionar un usuario de rango igual o superior');
    }
  }

  @Post('admin/users')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  async adminCreate(
    @CurrentUser() me: { id: string },
    @Body() body: { email: string; password: string; full_name?: string; email_confirm?: boolean },
  ) {
    await this.authorize(me.id, 'create');
    return this.auth.adminCreateUser(body);
  }

  @Patch('admin/users/:id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async adminUpdate(
    @CurrentUser() me: { id: string },
    @Param('id') id: string,
    @Body() body: { email?: string; password?: string },
  ) {
    await this.authorize(me.id, 'edit', id);
    const res = await this.auth.adminUpdateUser(id, body);
    this.rbac.invalidate();
    return res;
  }

  @Delete('admin/users/:id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async adminDelete(@CurrentUser() me: { id: string }, @Param('id') id: string) {
    await this.authorize(me.id, 'delete', id);
    const res = await this.auth.adminDeleteUser(id);
    this.rbac.invalidate();
    return res;
  }
}
