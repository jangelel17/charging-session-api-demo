import fs from 'fs';
import path from 'path';

export class ReceiptNotFoundError extends Error {}

/**
 * Resolves a caller-supplied receipt name to a file inside the archive root.
 *
 * @throws ReceiptNotFoundError if the name resolves outside the root or to a missing file.
 */
export function resolveReceiptPath(archiveRoot: string, requestedName: string): string {
  let root: string;
  let target: string;
  try {
    // realpath, not resolve: a symlink inside the archive must not lead out of it.
    root = fs.realpathSync(path.resolve(archiveRoot));
    target = fs.realpathSync(path.resolve(root, requestedName));
  } catch {
    throw new ReceiptNotFoundError(requestedName);
  }

  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new ReceiptNotFoundError(requestedName);
  }

  if (!fs.statSync(target).isFile()) {
    throw new ReceiptNotFoundError(requestedName);
  }

  return target;
}
