import fs from 'fs';
import path from 'path';

export class ReceiptNotFoundError extends Error {}

/**
 * Resolves a caller-supplied receipt name to a file inside the archive root.
 *
 * @throws ReceiptNotFoundError if the name resolves outside the root or to a missing file.
 */
export function resolveReceiptPath(archiveRoot: string, requestedName: string): string {
  const root = path.resolve(archiveRoot);
  const target = path.resolve(root, requestedName);

  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new ReceiptNotFoundError(requestedName);
  }

  const stats = fs.statSync(target, { throwIfNoEntry: false });
  if (stats === undefined || !stats.isFile()) {
    throw new ReceiptNotFoundError(requestedName);
  }

  return target;
}
