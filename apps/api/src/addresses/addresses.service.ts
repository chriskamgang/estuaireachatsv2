import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Liste des adresses de l'utilisateur
   */
  async findAll(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      include: { country: { select: { id: true, name: true, code: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return { result: true, data: addresses };
  }

  /**
   * Creer une adresse
   */
  async create(userId: string, dto: CreateAddressDto) {
    // Si isDefault, retirer le defaut des autres adresses
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        userId,
        fullName: dto.fullName,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        region: dto.region,
        countryId: dto.countryId,
        postalCode: dto.postalCode,
        isDefault: dto.isDefault ?? false,
        label: dto.label,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    return { result: true, data: address };
  }

  /**
   * Modifier une adresse
   */
  async update(addressId: string, userId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address) throw new NotFoundException('Adresse introuvable');
    if (address.userId !== userId) throw new ForbiddenException('Acces refuse');

    // Si on met isDefault, retirer le defaut des autres
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });

    return { result: true, data: updated };
  }

  /**
   * Supprimer une adresse
   */
  async remove(addressId: string, userId: string) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address) throw new NotFoundException('Adresse introuvable');
    if (address.userId !== userId) throw new ForbiddenException('Acces refuse');

    await this.prisma.address.delete({ where: { id: addressId } });

    return { result: true, message: 'Adresse supprimee' };
  }

  /**
   * Liste des pays
   */
  async getCountries() {
    const countries = await this.prisma.country.findMany({
      orderBy: { name: 'asc' },
    });
    return { result: true, data: countries };
  }

  /**
   * Regions/provinces d'un pays
   */
  async getStates(countryId: string) {
    const states = await this.prisma.state.findMany({
      where: { countryId },
      orderBy: { name: 'asc' },
    });
    return { result: true, data: states };
  }

  /**
   * Villes d'une region
   */
  async getCities(stateId: string) {
    const cities = await this.prisma.city.findMany({
      where: { stateId },
      orderBy: { name: 'asc' },
    });
    return { result: true, data: cities };
  }
}
