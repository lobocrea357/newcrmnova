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

  /* ------------------------- Admin de usuarios (service) ------------------------- */

  /** Crea un registro en `users` (equivalente a supabase.auth.admin.createUser). */
  async adminCreateUser(data: {
    email: string;
    password: string;
    full_name?: string;
    email_confirm?: boolean;
  }) {
    const email = data.email.toLowerCase().trim();
    const password_hash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.users.create({
      data: {
        email,
        password_hash,
        full_name: data.full_name ?? null,
        email_confirmed_at: data.email_confirm ? new Date() : null,
      },
    });
    return { user: { id: user.id, email: user.email } };
  }

  /** Actualiza email y/o password (equivalente a auth.admin.updateUserById). */
  async adminUpdateUser(
    id: string,
    updates: { email?: string; password?: string },
  ) {
    const data: any = {};
    if (updates.email) data.email = updates.email.toLowerCase().trim();
    if (updates.password) data.password_hash = await bcrypt.hash(updates.password, 10);
    if (Object.keys(data).length === 0) {
      const u = await this.prisma.users.findUnique({ where: { id } });
      return { user: u ? { id: u.id, email: u.email } : null };
    }
    const user = await this.prisma.users.update({ where: { id }, data });
    return { user: { id: user.id, email: user.email } };
  }

  /** Borra el perfil y luego el usuario (equivalente a auth.admin.deleteUser). */
  async adminDeleteUser(id: string) {
    await this.prisma.profiles.deleteMany({ where: { id } });
    await this.prisma.users.deleteMany({ where: { id } });
    return { ok: true };
  }

  /** ¿El usuario tiene rol admin/super_admin? (para proteger rutas admin) */
  async isAdmin(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId);
    const name = profile?.roles?.name;
    return name === 'super_admin' || name === 'admin';
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
