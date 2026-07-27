import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Alibaba Open Platform API Client
 * Doc: https://developer.alibaba.com/docs
 *
 * Variables d'environnement requises (apres approbation):
 *   ALIBABA_APP_KEY=xxxxx
 *   ALIBABA_APP_SECRET=xxxxx
 *   ALIBABA_ACCESS_TOKEN=xxxxx  (OAuth token de l'entreprise)
 */

export interface AlibabaProduct {
  productId: string;
  subject: string;
  description: string;
  price: number;
  priceUnit: string;
  minOrderQuantity: number;
  unit: string;
  mainImage: string;
  images: string[];
  productUrl: string;
  categoryId: string;
  categoryName: string;
}

export interface AlibabaSupplier {
  memberId: string;
  loginId: string;
  companyName: string;
  country: string;
  province: string;
  city: string;
  businessType: string;
  mainProducts: string[];
  totalEmployees: string;
  yearEstablished: number;
  annualRevenue: string;
  certifications: string[];
  logo: string;
  profileUrl: string;
}

export interface AlibabaSearchResult {
  total: number;
  page: number;
  pageSize: number;
  products: AlibabaProduct[];
}

@Injectable()
export class AlibabaApiService {
  private readonly logger = new Logger(AlibabaApiService.name);
  private readonly BASE_URL = 'https://gw.aliunicorn.com/openapi';
  private readonly GATEWAY_URL = 'https://api.alibaba.com/router/rest';

  get appKey(): string {
    return process.env.ALIBABA_APP_KEY || '';
  }

  get appSecret(): string {
    return process.env.ALIBABA_APP_SECRET || '';
  }

  get accessToken(): string {
    return process.env.ALIBABA_ACCESS_TOKEN || '';
  }

  get isConfigured(): boolean {
    return !!(this.appKey && this.appSecret);
  }

  /**
   * Verifier si l'API est configuree
   */
  checkConfig() {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'Alibaba Open Platform API non configuree. Ajoutez ALIBABA_APP_KEY et ALIBABA_APP_SECRET dans le .env apres approbation.',
      );
    }
  }

  /**
   * Generer la signature HMAC-MD5 pour Alibaba Open Platform
   * Algo: md5(appSecret + sorted_params_string + appSecret)
   */
  private generateSign(params: Record<string, string>): string {
    // Trier les cles alphabetiquement
    const sortedKeys = Object.keys(params).sort();
    let paramString = '';
    for (const key of sortedKeys) {
      paramString += key + params[key];
    }
    // Encadrer avec le secret
    const signStr = this.appSecret + paramString + this.appSecret;
    return crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();
  }

  /**
   * Appel generique a l'API Alibaba
   */
  private async callApi<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
    this.checkConfig();

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const baseParams: Record<string, string> = {
      method,
      app_key: this.appKey,
      timestamp,
      format: 'json',
      v: '2.0',
      sign_method: 'md5',
      ...(this.accessToken && { session: this.accessToken }),
    };

    // Ajouter les parametres metier (convertir en string)
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        baseParams[k] = String(v);
      }
    }

    // Generer la signature
    baseParams.sign = this.generateSign(baseParams);

    // Construire la query string
    const qs = new URLSearchParams(baseParams).toString();
    const url = `${this.GATEWAY_URL}?${qs}`;

    this.logger.log(`Alibaba API call: ${method}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!response.ok) {
      throw new BadRequestException(`Alibaba API HTTP error: ${response.status}`);
    }

    const data = await response.json();

    // Verifier les erreurs API
    if (data.error_response) {
      const err = data.error_response;
      this.logger.error(`Alibaba API error: ${err.code} - ${err.zh_desc || err.en_desc}`);
      throw new BadRequestException(`Alibaba API: ${err.en_desc || err.zh_desc || 'Unknown error'} (code: ${err.code})`);
    }

    return data;
  }

  /**
   * Rechercher des produits par mot-cle
   */
  async searchProducts(options: {
    keyword: string;
    categoryId?: string;
    page?: number;
    pageSize?: number;
    priceMin?: number;
    priceMax?: number;
    country?: string;
  }): Promise<AlibabaSearchResult> {
    const params: Record<string, any> = {
      keywords: options.keyword,
      page_size: options.pageSize || 20,
      page_no: options.page || 1,
      ...(options.categoryId && { cat_id: options.categoryId }),
      ...(options.priceMin && { price_start: options.priceMin }),
      ...(options.priceMax && { price_end: options.priceMax }),
      ...(options.country && { country: options.country }),
    };

    const raw = await this.callApi('alibaba.icbu.product.list', params);
    const result = raw['alibaba_icbu_product_list_response'] || {};

    const products: AlibabaProduct[] = (result.products?.alibaba_product_brief_response || []).map((p: any) => ({
      productId: p.product_id,
      subject: p.subject || '',
      description: p.description || '',
      price: parseFloat(p.price?.cent || '0') / 100,
      priceUnit: p.price?.currency_code || 'USD',
      minOrderQuantity: parseInt(p.min_order_quantity || '1', 10),
      unit: p.unit || 'piece',
      mainImage: p.main_image?.startsWith('//') ? `https:${p.main_image}` : (p.main_image || ''),
      images: (p.image_list?.string || []).map((img: string) =>
        img.startsWith('//') ? `https:${img}` : img,
      ),
      productUrl: `https://www.alibaba.com/product-detail/_${p.product_id}.html`,
      categoryId: p.cat_id || '',
      categoryName: p.cat_name || '',
    }));

    return {
      total: result.total_count || 0,
      page: options.page || 1,
      pageSize: options.pageSize || 20,
      products,
    };
  }

  /**
   * Obtenir les details d'un produit
   */
  async getProduct(productId: string): Promise<AlibabaProduct> {
    const raw = await this.callApi('alibaba.icbu.product.get', {
      product_id: productId,
      language: 'en',
    });

    const p = raw['alibaba_icbu_product_get_response']?.product || {};

    return {
      productId: p.product_id,
      subject: p.subject || '',
      description: p.description || '',
      price: parseFloat(p.price_range?.price_info?.[0]?.price || '0'),
      priceUnit: 'USD',
      minOrderQuantity: parseInt(p.price_range?.price_info?.[0]?.start_quantity || '1', 10),
      unit: p.unit || 'piece',
      mainImage: p.main_image?.startsWith('//') ? `https:${p.main_image}` : (p.main_image || ''),
      images: (p.image_list?.string || []).map((img: string) =>
        img.startsWith('//') ? `https:${img}` : img,
      ),
      productUrl: `https://www.alibaba.com/product-detail/_${p.product_id}.html`,
      categoryId: p.cat_id || '',
      categoryName: p.cat_name || '',
    };
  }

  /**
   * Obtenir les produits d'un fournisseur
   */
  async getSupplierProducts(memberId: string, page = 1, pageSize = 20): Promise<AlibabaSearchResult> {
    const raw = await this.callApi('alibaba.icbu.product.list', {
      member_id: memberId,
      page_size: pageSize,
      page_no: page,
    });

    const result = raw['alibaba_icbu_product_list_response'] || {};
    const products: AlibabaProduct[] = (result.products?.alibaba_product_brief_response || []).map((p: any) => ({
      productId: p.product_id,
      subject: p.subject || '',
      description: p.description || '',
      price: parseFloat(p.price?.cent || '0') / 100,
      priceUnit: p.price?.currency_code || 'USD',
      minOrderQuantity: parseInt(p.min_order_quantity || '1', 10),
      unit: p.unit || 'piece',
      mainImage: p.main_image?.startsWith('//') ? `https:${p.main_image}` : (p.main_image || ''),
      images: [],
      productUrl: `https://www.alibaba.com/product-detail/_${p.product_id}.html`,
      categoryId: p.cat_id || '',
      categoryName: p.cat_name || '',
    }));

    return {
      total: result.total_count || 0,
      page,
      pageSize,
      products,
    };
  }

  /**
   * Obtenir les infos d'un fournisseur par son loginId (ex: "zsbcs")
   */
  async getSupplierInfo(loginId: string): Promise<AlibabaSupplier> {
    const raw = await this.callApi('alibaba.icbu.company.profile.get', {
      login_id: loginId,
    });

    const c = raw['alibaba_icbu_company_profile_get_response']?.company || {};

    return {
      memberId: c.member_id || '',
      loginId: c.login_id || loginId,
      companyName: c.company_name || '',
      country: c.country || 'CN',
      province: c.province || '',
      city: c.city || '',
      businessType: c.business_type || '',
      mainProducts: c.main_products?.string || [],
      totalEmployees: c.total_employees || '',
      yearEstablished: parseInt(c.year_established || '0', 10),
      annualRevenue: c.annual_revenue || '',
      certifications: (c.certifications?.certification || []).map((cert: any) => cert.name || cert),
      logo: c.logo?.startsWith('//') ? `https:${c.logo}` : (c.logo || ''),
      profileUrl: `https://${loginId}.en.alibaba.com`,
    };
  }

  /**
   * Rechercher des fournisseurs
   */
  async searchSuppliers(options: {
    keyword: string;
    country?: string;
    page?: number;
    pageSize?: number;
  }) {
    const raw = await this.callApi('alibaba.icbu.member.list', {
      keywords: options.keyword,
      page_size: options.pageSize || 20,
      page_no: options.page || 1,
      ...(options.country && { country: options.country }),
    });

    const result = raw['alibaba_icbu_member_list_response'] || {};
    const suppliers = (result.members?.alibaba_member_brief_response || []).map((m: any) => ({
      memberId: m.member_id,
      loginId: m.login_id,
      companyName: m.company_name || '',
      country: m.country || '',
      city: m.city || '',
      logo: m.logo?.startsWith('//') ? `https:${m.logo}` : (m.logo || ''),
      profileUrl: `https://${m.login_id}.en.alibaba.com`,
      totalProducts: m.product_count || 0,
    }));

    return {
      total: result.total_count || 0,
      page: options.page || 1,
      pageSize: options.pageSize || 20,
      suppliers,
    };
  }

  /**
   * Obtenir les categories Alibaba
   */
  async getCategories(parentId?: number) {
    const raw = await this.callApi('alibaba.icbu.category.get', {
      ...(parentId && { cat_id: parentId }),
      language: 'en',
    });

    const cats = raw['alibaba_icbu_category_get_response']?.categories?.alibaba_category || [];
    return cats.map((c: any) => ({
      id: c.cat_id,
      name: c.name,
      parentId: c.parent_cat_id,
      level: c.level,
      hasChildren: c.has_children,
    }));
  }

  /**
   * Verifier le statut de l'API (config + connexion)
   */
  async getStatus() {
    return {
      configured: this.isConfigured,
      appKey: this.appKey ? `${this.appKey.substring(0, 4)}****` : null,
      hasAccessToken: !!this.accessToken,
      message: this.isConfigured
        ? 'API Alibaba configuree et prete'
        : 'En attente des cles API (ALIBABA_APP_KEY, ALIBABA_APP_SECRET)',
    };
  }
}
