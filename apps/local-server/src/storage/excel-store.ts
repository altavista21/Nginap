import ExcelJS from "exceljs";
import { mkdir, copyFile, rename, rm, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DEFAULT_ROOM_TYPES, WORKSHEETS } from "./schema.js";

class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.tail.then(operation, operation);
    this.tail = next.then(() => undefined, () => undefined);
    return next;
  }
}

export class ExcelStore {
  private readonly queue = new SerialQueue();
  constructor(private readonly filePath: string, private readonly backupDir: string) {}

  async initialize(): Promise<void> {
    await this.queue.run(async () => {
      await mkdir(path.dirname(this.filePath), { recursive: true });
      await mkdir(this.backupDir, { recursive: true });
      try {
        await access(this.filePath, constants.F_OK);
        await this.readWorkbook();
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
    const roomTypes = workbook.getWorksheet("RoomTypes");
    for (const row of DEFAULT_ROOM_TYPES) roomTypes?.addRow([...row]);
    const settings = workbook.getWorksheet("Settings");
    [
      ["HotelName", "Java Hotel"],
      ["HotelAddress", "Jalan Jend. Sudirman No. 40–45, Jakarta Selatan, DKI Jakarta, Indonesia"],
      ["CheckInTime", "12:00"], ["CheckOutTime", "12:00"], ["TimeZone", "Asia/Jakarta"],
      ["Currency", "IDR"], ["CancellationPolicy", "AdminApprovalRequired"], ["WorkbookSchemaVersion", "1"],
    ].forEach((row) => settings?.addRow(row));
    return workbook;
  }

  private async readWorkbook(): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.filePath);
    return workbook;
  }

  private async persist(workbook: ExcelJS.Workbook, createBackup: boolean): Promise<void> {
    const temporaryPath = this.filePath + "." + randomUUID() + ".tmp";
    try {
      await workbook.xlsx.writeFile(temporaryPath);
      if (createBackup) {
        const backupPath = path.join(this.backupDir, "NGINAP_DATABASE-" + new Date().toISOString().replace(/[:.]/g, "-") + ".xlsx");
        await copyFile(this.filePath, backupPath);
      }
      await rename(temporaryPath, this.filePath);
    } catch (error) {
      await rm(temporaryPath, { force: true }).catch(() => undefined);
      throw error;
    }
  }

  async getStatus(): Promise<{ workbook: string; sheets: string[]; initialized: boolean }> {
    return this.queue.run(async () => {
      const workbook = await this.readWorkbook();
      return { workbook: path.basename(this.filePath), sheets: workbook.worksheets.map((sheet) => sheet.name), initialized: true };
    });
  }
}
