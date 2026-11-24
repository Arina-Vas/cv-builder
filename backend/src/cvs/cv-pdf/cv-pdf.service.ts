import { CvPdf } from '@/cvs/cv-pdf/models/cv-pdf.model';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '@/config/env.validation';
import { User } from '@/users/models/user.model';
import { renderCvPdfHtml } from '@/cvs/cv-pdf/cv-pdf.template';
import { toPdfFileName } from '@/cvs/cv-pdf/cv-pdf-file-name';
import { GenerateCvPdfInput } from '@/cvs/cv-pdf/dto/generate-cv-pdf.input';
import { CvPreviewService } from '@/cvs/cv-preview/cv-preview.service';

@Injectable()
export class CvPdfService implements OnModuleDestroy {
  private browser?: Promise<Browser>;

  constructor(
    private readonly cvPreviewService: CvPreviewService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async generate(input: GenerateCvPdfInput, currentUser: User): Promise<CvPdf> {
    const preview = await this.cvPreviewService.getPreview(currentUser, input.cvId);
    const page = await (this.browser ??= this.launch()).then((browser) => browser.newPage());

    try {
      await page.setContent(renderCvPdfHtml(preview, input.locale), { waitUntil: 'load' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      return {
        fileName: toPdfFileName(preview.name),
        content: Buffer.from(pdf).toString('base64'),
      };
    } finally {
      await page.close();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await (await this.browser)?.close();
  }

  private launch(): Promise<Browser> {
    const noSandbox = this.config.get('PUPPETEER_NO_SANDBOX', { infer: true });
    return puppeteer.launch({ headless: 'shell', args: noSandbox ? ['--no-sandbox'] : [] });
  }
}
