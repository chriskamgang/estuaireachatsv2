import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  // ── Posts ──────────────────────────────────────────────────

  async findAllPosts(page = 1, perPage = 15) {
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
        include: { category: true },
      }),
      this.prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async findPostBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!post) throw new NotFoundException('Article introuvable');

    // Increment views
    await this.prisma.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    return { data: { ...post, views: post.views + 1 } };
  }

  async createPost(dto: {
    title: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    image?: string;
    author?: string;
    categoryId?: string;
    status?: string;
  }) {
    const slug = dto.slug || this.generateSlug(dto.title);

    const existing = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Ce slug est deja utilise');

    const post = await this.prisma.blogPost.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        excerpt: dto.excerpt,
        image: dto.image,
        author: dto.author,
        categoryId: dto.categoryId,
        status: (dto.status as any) || 'DRAFT',
      },
      include: { category: true },
    });

    return { data: post };
  }

  async updatePost(
    id: string,
    dto: {
      title?: string;
      slug?: string;
      content?: string;
      excerpt?: string;
      image?: string;
      author?: string;
      categoryId?: string;
      status?: string;
    },
  ) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Article introuvable');

    if (dto.slug && dto.slug !== post.slug) {
      const existing = await this.prisma.blogPost.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('Ce slug est deja utilise');
    }

    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
        ...(dto.image !== undefined && { image: dto.image }),
        ...(dto.author !== undefined && { author: dto.author }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.status !== undefined && { status: dto.status as any }),
      },
      include: { category: true },
    });

    return { data: updated };
  }

  async deletePost(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Article introuvable');

    await this.prisma.blogPost.delete({ where: { id } });
    return { data: { message: 'Article supprime' } };
  }

  // ── Categories ────────────────────────────────────────────

  async findAllCategories() {
    const categories = await this.prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
    return { data: categories };
  }

  async createCategory(dto: { name: string; slug?: string }) {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.prisma.blogCategory.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Ce slug est deja utilise');

    const category = await this.prisma.blogCategory.create({
      data: { name: dto.name, slug },
    });
    return { data: category };
  }

  async updateCategory(id: string, dto: { name?: string; slug?: string }) {
    const category = await this.prisma.blogCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categorie introuvable');

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.prisma.blogCategory.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('Ce slug est deja utilise');
    }

    const updated = await this.prisma.blogCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
      },
    });
    return { data: updated };
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.blogCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categorie introuvable');

    await this.prisma.blogCategory.delete({ where: { id } });
    return { data: { message: 'Categorie supprimee' } };
  }

  // ── Helpers ───────────────────────────────────────────────

  private generateSlug(text: string): string {
    return (
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now()
    );
  }
}
