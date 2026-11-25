import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadBase64File, REVOKE_URL_DELAY_MS } from './downloadBase64File';

// "%PDF" in base64
const BASE64 = 'JVBERg==';
const BLOB_URL = 'blob:http://localhost/pdf';
const PDF = 'application/pdf';

describe('downloadBase64File', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let click: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom has no object URLs
    createObjectURL = vi.fn(() => BLOB_URL);
    revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clicks a link to the blob with the given file name', () => {
    downloadBase64File(BASE64, 'software-engineer.pdf', PDF);

    expect(click).toHaveBeenCalledTimes(1);
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.href).toBe(BLOB_URL);
    expect(link.download).toBe('software-engineer.pdf');
  });

  it('puts the decoded bytes into a PDF blob', async () => {
    downloadBase64File(BASE64, 'cv.pdf', PDF);

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(blob.type).toBe('application/pdf');
    expect(new TextDecoder().decode(await blob.arrayBuffer())).toBe('%PDF');
  });

  it('uses the given MIME type', () => {
    downloadBase64File(BASE64, 'cv.txt', 'text/plain');

    expect((createObjectURL.mock.calls[0]?.[0] as Blob).type).toBe('text/plain');
  });

  // Firefox and Safari may start the download after the click handler returns
  it('revokes the blob URL only after a delay, not right after the click', () => {
    downloadBase64File(BASE64, 'cv.pdf', PDF);

    vi.advanceTimersByTime(REVOKE_URL_DELAY_MS - 1);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(revokeObjectURL).toHaveBeenCalledWith(BLOB_URL);
  });

  it('does not leave the link in the document', () => {
    downloadBase64File(BASE64, 'cv.pdf', PDF);

    expect(document.querySelector('a[download]')).toBeNull();
  });
});
