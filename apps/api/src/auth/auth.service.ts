import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email ou telephone requis');
    }

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new BadRequestException('Cet email est deja utilise');
    }

    if (dto.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (existing) throw new BadRequestException('Ce telephone est deja utilise');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: (dto.role as any) || 'BUYER',
      },
    });

    // Si vendeur, creer la boutique en attente
    if (dto.role === 'SELLER') {
      const slug = `${dto.firstName}-${dto.lastName}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-');
      await this.prisma.shop.create({
        data: {
          userId: user.id,
          name: `${dto.firstName} ${dto.lastName}`,
          slug,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email || user.phone || '', user.role);
    return {
      result: true,
      message: 'Inscription reussie',
      data: {
        user: { id: user.id, email: user.email, phone: user.phone, firstName: user.firstName, lastName: user.lastName, role: user.role },
        ...tokens,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.emailOrPhone },
          { phone: dto.emailOrPhone },
        ],
      },
    });

    if (!user) throw new UnauthorizedException('Identifiants incorrects');
    if (user.status === 'BANNED') throw new UnauthorizedException('Compte suspendu');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Identifiants incorrects');

    const tokens = await this.generateTokens(user.id, user.email || user.phone || '', user.role);
    return {
      result: true,
      message: 'Connexion reussie',
      data: {
        user: { id: user.id, email: user.email, phone: user.phone, firstName: user.firstName, lastName: user.lastName, role: user.role, avatar: user.avatar },
        ...tokens,
      },
    };
  }

  async socialLogin(dto: { provider: string; token: string; email?: string; firstName?: string; lastName?: string; photoUrl?: string }) {
    const { provider, email, firstName, lastName, photoUrl } = dto;

    if (!email) {
      throw new BadRequestException('Email requis pour la connexion sociale');
    }

    // Chercher un utilisateur existant par email
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      // Mettre a jour l'avatar si fourni et pas encore defini
      if (photoUrl && !user.avatar) {
        await this.prisma.user.update({ where: { id: user.id }, data: { avatar: photoUrl } });
      }
      if (user.status === 'BANNED') throw new UnauthorizedException('Compte suspendu');
    } else {
      // Creer un nouveau compte
      const randomPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await this.prisma.user.create({
        data: {
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          passwordHash,
          avatar: photoUrl || null,
          role: 'BUYER',
          status: 'ACTIVE',
          emailVerified: true, // Email verifie via Google/Apple
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email || '', user.role);
    return {
      result: true,
      message: `Connexion ${provider} reussie`,
      data: {
        user: { id: user.id, email: user.email, phone: user.phone, firstName: user.firstName, lastName: user.lastName, role: user.role, avatar: user.avatar },
        ...tokens,
      },
    };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === 'BANNED') throw new UnauthorizedException();
    return this.generateTokens(user.id, user.email || user.phone || '', user.role);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        avatar: true, role: true, status: true, locale: true, emailVerified: true, phoneVerified: true, createdAt: true,
        shop: { select: { id: true, name: true, slug: true, verified: true, status: true, logo: true } },
      },
    });
    return { result: true, data: user };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
