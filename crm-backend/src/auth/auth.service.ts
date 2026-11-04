import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user || !user.password_hash) return null;
    const ok = await bcrypt.compare(password, user.password_hash);
    return ok ? user : null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const profile = await this.getProfile(user.id);
    if (profile && profile.is_active === false) {
      throw new UnauthorizedException('Usuario inactivo');
    }
    const access_token = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { access_token, user: this.publicUser(user, profile) };
  }

  async me(userId: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const profile = await this.getProfile(user.id);
    return this.publicUser(user, profile);
  }

  private getProfile(userId: string) {
    return this.prisma.profiles.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
  }

  private publicUser(user: any, profile: any) {
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? user.full_name ?? null,
      is_active: profile?.is_active ?? true,
      avatar_url: profile?.avatar_url ?? null,
      role_id: profile?.role_id ?? null,
      equipo_id: profile?.equipo_id ?? null,
      sede_id: profile?.sede_id ?? null,
      role: profile?.roles
        ? {
            id: profile.roles.id,
            name: profile.roles.name,
            ranking: profile.roles.ranking,
            permissions: profile.roles.permissions,
          }
        : null,
    };
  }
}
