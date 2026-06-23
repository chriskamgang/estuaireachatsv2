import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private blogService: BlogService) {}

  // ── Posts ──────────────────────────────────────────────────

  @Get('posts')
  @ApiOperation({ summary: 'Liste des articles publies (public, pagine)' })
  findAllPosts(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.blogService.findAllPosts(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 15,
    );
  }

  @Get('posts/:slug')
  @ApiOperation({ summary: 'Detail d\'un article par slug (public)' })
  findPostBySlug(@Param('slug') slug: string) {
    return this.blogService.findPostBySlug(slug);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer un article (ADMIN)' })
  createPost(@Body() dto: any) {
    return this.blogService.createPost(dto);
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un article (ADMIN)' })
  updatePost(@Param('id') id: string, @Body() dto: any) {
    return this.blogService.updatePost(id, dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un article (ADMIN)' })
  deletePost(@Param('id') id: string) {
    return this.blogService.deletePost(id);
  }

  // ── Categories ────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'Liste des categories blog (public)' })
  findAllCategories() {
    return this.blogService.findAllCategories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer une categorie blog (ADMIN)' })
  createCategory(@Body() dto: any) {
    return this.blogService.createCategory(dto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une categorie blog (ADMIN)' })
  updateCategory(@Param('id') id: string, @Body() dto: any) {
    return this.blogService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une categorie blog (ADMIN)' })
  deleteCategory(@Param('id') id: string) {
    return this.blogService.deleteCategory(id);
  }
}
