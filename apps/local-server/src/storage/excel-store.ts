import ExcelJS from "exceljs-hardened";
import { mkdir, copyFile, rename, rm, access, stat, lstat, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DEFAULT_ROOM_TYPES, WORKSHEETS } from "./schema.js";
import { assertSafeXlsxArchive } from "./xlsx-preflight.js";

class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.tail.then(operation, operation);
    this.tail = next.then(() => undefined, () => undefined);
    return next;
  }
}

const MAX_WORKBOOK_BYTES = 25 * 1024 * 1024;
const MAX_BACKUPS = 30;

export class ExcelStore {
  private readonly queue = new SerialQueue();
  constructor(private readonly filePath: string, private readonly backupDir: string) {}

  async initialize(): Promise<void> {
    await this.queue.run(async () => {
      await mkdir(path.dirname(this.filePath), { recursive: true });
      await mkdir(this.backupDir, { recursive: true });
      try {
        await access(this.filePath, constants.F_OK);
        const workbook = await this.readWorkbook();
        this.validateWorkbook(workbook);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        await this.persist(this.createWorkbook(), false);
      }
    });
  }

  private createWorkbook(): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Nginap";
    workbook.subject = "Java Hotel reservation and operations data";
    workbook.created = new Date();
    for (const [name, headers] of Object.entries(WORKSHEETS)) {
      const sheet = workbook.addWorksheet(name);
      sheet.addRow([...headers]);
      sheet.getRow(1).font = { bold: true };
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      sheet.columns = headers.map((header) => ({ header, key: header, width: Math.max(16, header.length + 3) }));
    }
    for (const row of DEFAULT_ROOM_TYPES) workbook.getWorksheet("RoomTypes")?.addRow([...row]);
    [
      ["HotelName","Java Hotel"],
      ["HotelAddress","Jalan Jend. Sudirman No. 40–45, Jakarta Selatan, DKI Jakarta, Indonesia"],
      ["CheckInTime","12:00"],["CheckOutTime","12:00"],["TimeZone","Asia/Jakarta"],
      ["Currency","IDR"],["CancellationPolicy","AdminApprovalRequired"],["WorkbookSchemaVersion","1"],
    ].forEach((row) => workbook.getWorksheet("Settings")?.addRow(row));
    return workbook;
  }

  private async readWorkbook(): Promise<ExcelJS.Workbook> {
    const file = await lstat(this.filePath);
    if (!file.isFile() || file.isSymbolicLink()) throw new Error("Workbook must be a regular non-symlink file.");
    if (file.size < 4 || file.size > MAX_WORKBOOK_BYTES) throw new Error("Workbook file size is outside the permitted limit.");
    const archive = await readFile(this.filePath);
    assertSafeXlsxArchive(archive);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(archive, { maxEntryUncompressedSize: 32 * 1024 * 1024, maxTotalUncompressedSize: 128 * 1024 * 1024, maxMergeCells: 10_000, maxDataValidationCells: 100_000, maxDefinedNameCells: 100_000 });
    return workbook;
  }

  private validateWorkbook(workbook: ExcelJS.Workbook): void {
    for (const [name, headers] of Object.entries(WORKSHEETS)) {
      const sheet = workbook.getWorksheet(name);
      if (!sheet) throw new Error("Workbook schema invalid: missing worksheet " + name);
      const actual = headers.map((_, index) => String(sheet.getCell(1, index + 1).value ?? ""));
      if (headers.some((header, index) => actual[index] !== header)) {
        throw new Error("Workbook schema invalid: headers mismatch in " + name);
      }
    }
  }

  private async persist(workbook: ExcelJS.Workbook, createBackup: boolean): Promise<void> {
    const temporaryPath = this.filePath + "." + randomUUID() + ".tmp";
    try {
      await workbook.xlsx.writeFile(temporaryPath);
      if (createBackup) {
        const backupPath = path.join(this.backupDir, "NGINAP_DATABASE-" + new Date().toISOString().replace(/[:.]/g, "-") + "-" + randomUUID() + ".xlsx");
        await copyFile(this.filePath, backupPath);
        await this.pruneBackups();
      }
      await rename(temporaryPath, this.filePath);
    } catch (error) {
      await rm(temporaryPath, { force: true }).catch(() => undefined);
      throw error;
    }
  }

  private async pruneBackups(): Promise<void> {
    const files = (await readdir(this.backupDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && /^NGINAP_DATABASE-.*\.xlsx$/.test(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => b.localeCompare(a));
    await Promise.all(files.slice(MAX_BACKUPS).map((name) => rm(path.join(this.backupDir, name), { force: true })));
  }

  async read<T>(reader: (workbook: ExcelJS.Workbook) => T | Promise<T>): Promise<T> {
    return this.queue.run(async () => {
      const workbook = await this.readWorkbook();
      this.validateWorkbook(workbook);
      return reader(workbook);
    });
  }

  async transaction<T>(operation: (workbook: ExcelJS.Workbook) => T | Promise<T>): Promise<T> {
    return this.queue.run(async () => {
      const workbook = await this.readWorkbook();
      this.validateWorkbook(workbook);
      const result = await operation(workbook);
      await this.persist(workbook, true);
      return result;
    });
  }

  async getStatus(): Promise<{ workbook: string; sheets: string[]; initialized: boolean; bytes: number }> {
    return this.queue.run(async () => {
      const workbook = await this.readWorkbook();
      this.validateWorkbook(workbook);
      const info = await stat(this.filePath);
      return { workbook: path.basename(this.filePath), sheets: workbook.worksheets.map((sheet) => sheet.name), initialized: true, bytes: info.size };
    });
  }
}
