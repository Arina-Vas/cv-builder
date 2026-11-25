/**
 * Firefox and Safari may start the download after the click handler returns, so the object URL
 * is revoked later, not right away (FileSaver.js waits 40 s for the same reason)
 */
export const REVOKE_URL_DELAY_MS = 60_000;

export const downloadBase64File = (base64: string, fileName: string, mimeType: string) => {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_URL_DELAY_MS);
};
