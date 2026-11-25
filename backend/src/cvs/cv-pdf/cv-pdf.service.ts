import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Browser } from 'puppeteer';
import { EnvironmentVariables } from '@/config/env.validation';
import { toPdfFileName } from '@/cvs/cv-pdf/cv-pdf-file-name';
import { renderCvPdfHtml } from '@/cvs/cv-pdf/cv-pdf.template';
import { GenerateCvPdfInput } from '@/cvs/cv-pdf/dto/generate-cv-pdf.input';
import { CvPdf } from '@/cvs/cv-pdf/models/cv-pdf.model';
import { CvPreviewService } from '@/cvs/cv-preview/cv-preview.service';
import { User } from '@/users/models/user.model';

@Injectable()
export class CvPdfService implements OnModuleDestroy {
  private browser?: Promise<Browser>;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly cvPreviewService: CvPreviewService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async generate(input: GenerateCvPdfInput, currentUser: User): Promise<CvPdf> {
    const preview = await this.cvPreviewService.getPreview(currentUser, input.cvId);
    const html = renderCvPdfHtml(preview, input.locale);
    const pdf = await this.enqueue(() => this.renderPdf(html));

    return { fileName: toPdfFileName(preview.name), content: Buffer.from(pdf).toString('base64') };
  }

  async onModuleDestroy(): Promise<void> {
    await (await this.browser?.catch(() => undefined))?.close();
  }

  /** PDFs are rendered one at a time, so parallel requests never open many Chromium pages */
  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this.queue.then(task);
    this.queue = result.catch(() => undefined);
    return result;
  }

  private async renderPdf(html: string): Promise<Uint8Array> {
    const page = await (await this.getBrowser()).newPage();
    try {
      await page.setJavaScriptEnabled(false);
      await page.setContent(html, { waitUntil: 'load' });
      return await page.pdf({ format: 'A4', printBackground: true });
    } finally {
      await page.close();
    }
  }

  private getBrowser(): Promise<Browser> {
    if (!this.browser) {
      const launching = this.launch();
      const forget = () => {
        if (this.browser === launching) this.browser = undefined;
      };
      launching.then((browser) => browser.once('disconnected', forget), forget);
      this.browser = launching;
    }
    return this.browser;
  }

  private launch(): Promise<Browser> {
    const noSandbox = this.config.get('PUPPETEER_NO_SANDBOX', { infer: true });
    return puppeteer.launch({ headless: 'shell', args: noSandbox ? ['--no-sandbox'] : [] });
  }
}
