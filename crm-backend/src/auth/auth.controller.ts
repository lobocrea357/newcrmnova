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

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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

  private async ensureAdmin(userId: string) {
    if (!(await this.auth.isAdmin(userId))) {
      throw new ForbiddenException('Requiere rol administrador');
    }
  }

  @Post('admin/users')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  async adminCreate(
    @CurrentUser() me: { id: string },
    @Body() body: { email: string; password: string; full_name?: string; email_confirm?: boolean },
  ) {
    await this.ensureAdmin(me.id);
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
    await this.ensureAdmin(me.id);
    return this.auth.adminUpdateUser(id, body);
  }

  @Delete('admin/users/:id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async adminDelete(@CurrentUser() me: { id: string }, @Param('id') id: string) {
    await this.ensureAdmin(me.id);
    return this.auth.adminDeleteUser(id);
  }
}
