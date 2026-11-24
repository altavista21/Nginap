import { inflateRawSync } from "node:zlib";

const MAX_ARCHIVE_BYTES = 25 * 1024 * 1024;
const MAX_ENTRY_BYTES = 32 * 1024 * 1024;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 128 * 1024 * 1024;
const MAX_XML_BYTES = 8 * 1024 * 1024;

function cellAddress(value: string): { row: number; column: number } | null {
  const match = /^\$?([A-Z]{1,3})\$?(\d+)$/i.exec(value);
  if (!match) return null;
  let column = 0;
  for (const char of match[1].toUpperCase()) column = column * 26 + char.charCodeAt(0) - 64;
  return { row: Number(match[2]), column };
}

export function assertSafeXlsxXml(entryName: string, xml: string): void {
  if (/\/worksheets\/sheet\d+\.xml$/i.test(entryName)) {
    const merges = xml.matchAll(/<mergeCell\b[^>]*\bref=["']([^"']+)["']/gi);
    for (const match of merges) {
      const parts = match[1].split(":");
      const start = cellAddress(parts[0]);
      const end = cellAddress(parts[1] ?? parts[0]);
      if (!start || !end) throw new Error("Workbook contains an invalid merged-cell range.");
      const rows = Math.abs(end.row - start.row) + 1;
      const columns = Math.abs(end.column - start.column) + 1;
      if (end.row > 100_000 || start.row > 100_000 || end.column > 256 || start.column > 256 || rows * columns > 10_000) {
        throw new Error("Workbook contains an oversized merged-cell range.");
      }
    }
  }

  if (/\/drawings\/drawing\d+\.xml$/i.test(entryName)) {
    const columns = xml.matchAll(/<(?:[A-Za-z0-9_]+:)?col>\s*(\d+)\s*<\/(?:[A-Za-z0-9_]+:)?col>/gi);
    for (const match of columns) if (Number(match[1]) > 255) throw new Error("Workbook contains an out-of-range drawing column.");
    const rows = xml.matchAll(/<(?:[A-Za-z0-9_]+:)?row>\s*(\d+)\s*<\/(?:[A-Za-z0-9_]+:)?row>/gi);
    for (const match of rows) if (Number(match[1]) > 100_000) throw new Error("Workbook contains an out-of-range drawing row.");
  }
}

export function assertSafeXlsxArchive(buffer: Buffer): void {
  if (buffer.byteLength < 22 || buffer.byteLength > MAX_ARCHIVE_BYTES || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error("Workbook archive is not a permitted XLSX file.");
  }

  const minimum = Math.max(0, buffer.length - 65_557);
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= minimum; offset--) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) { eocd = offset; break; }
  }
  if (eocd < 0) throw new Error("Workbook ZIP directory is invalid.");

  const archiveCommentLength = buffer.readUInt16LE(eocd + 20);\n  if (eocd + 22 + archiveCommentLength !== buffer.length) throw new Error("Workbook ZIP end record is invalid.");\n\n  const disk = buffer.readUInt16LE(eocd + 4);
  const centralDisk = buffer.readUInt16LE(eocd + 6);
  const entriesOnDisk = buffer.readUInt16LE(eocd + 8);
  const entriesTotal = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (disk !== 0 || centralDisk !== 0 || entriesOnDisk !== entriesTotal || entriesTotal === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff || centralOffset + centralSize > eocd) {
    throw new Error("Workbook ZIP64 or multi-disk archives are not supported.");
  }

  let offset = centralOffset;
  let totalUncompressed = 0;
  let totalXml = 0;
  for (let index = 0; index < entriesTotal; index++) {
    if (offset + 46 > centralOffset + centralSize || buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Workbook ZIP directory entry is invalid.");
    }
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const end = offset + 46 + nameLength + extraLength + commentLength;
    if (end > centralOffset + centralSize || (flags & 1) !== 0 || compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) {
      throw new Error("Workbook contains an unsupported or encrypted ZIP entry.");
    }
    if (uncompressedSize > MAX_ENTRY_BYTES || compressedSize > MAX_ARCHIVE_BYTES) throw new Error("Workbook contains an oversized ZIP entry.");
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES) throw new Error("Workbook expands beyond the permitted archive size.");

    const entryName = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    if (entryName.toLowerCase().endsWith(".xml")) {
      totalXml += uncompressedSize;
      if (uncompressedSize > MAX_XML_BYTES || totalXml > 16 * 1024 * 1024) throw new Error("Workbook XML exceeds the permitted inspection size.");
      if (localOffset + 30 > centralOffset || buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error("Workbook ZIP local header is invalid.");
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      if (dataOffset + compressedSize > centralOffset) throw new Error("Workbook ZIP entry exceeds its data boundary.");
      const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
      let xmlBuffer: Buffer;
      if (method === 0) xmlBuffer = compressed;
      else if (method === 8) xmlBuffer = inflateRawSync(compressed, { maxOutputLength: MAX_XML_BYTES });
      else throw new Error("Workbook uses an unsupported ZIP compression method.");
      if (xmlBuffer.byteLength !== uncompressedSize) throw new Error("Workbook ZIP entry size does not match its directory.");
      assertSafeXlsxXml(entryName, xmlBuffer.toString("utf8"));
    }
    offset = end;
  }
  if (offset !== centralOffset + centralSize) throw new Error("Workbook ZIP directory length is invalid.");
}
