import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ExcelStore } from "../src/storage/excel-store.js";
import { HotelDomain } from "../src/domain.js";
import { assertSafeXlsxXml } from "../src/storage/xlsx-preflight.js";

test("booking allocation is serialized, idempotent and cancellation holds inventory until admin approval", async () => {
  const dir=await mkdtemp(path.join(os.tmpdir(),"nginap-test-"));
  try {
    const store=new ExcelStore(path.join(dir,"data","NGINAP_DATABASE.xlsx"),path.join(dir,"backups"));
    await store.initialize();
    const domain=new HotelDomain(store,"test-session-secret-that-is-long-enough-123456");
    await domain.bootstrap("superadmin","VeryStrongTestPassword123!");
    const admin=await domain.login("superadmin","VeryStrongTestPassword123!");
    assert.equal(await domain.isActiveActor(admin),true,"new staff sessions must be active");
    await domain.setRoomTypeRate(admin,"RT001",450000,2,"Standard room");
    await domain.saveRoom(admin,{roomNumber:"101",typeId:"RT001",floor:"1"});
    const checkIn=new Date(Date.now()+2*86400000).toLocaleDateString("en-CA",{timeZone:"Asia/Jakarta"});
    const checkOut=new Date(Date.now()+3*86400000).toLocaleDateString("en-CA",{timeZone:"Asia/Jakarta"});
    const base={name:"Guest Test",phone:"081234567890",checkIn,checkOut,roomTypeId:"RT001",roomCount:1};
    const attempts=await Promise.allSettled([
      domain.createBooking({...base,email:"one@example.com",idempotencyKey:"booking-request-key-001"},null),
      domain.createBooking({...base,email:"two@example.com",idempotencyKey:"booking-request-key-002"},null),
    ]);
    assert.equal(attempts.filter(x=>x.status==="fulfilled").length,1,"only one concurrent request may get the final room");
    assert.equal(attempts.filter(x=>x.status==="rejected").length,1);
    const winner=attempts.find(x=>x.status==="fulfilled");
    assert.ok(winner&&winner.status==="fulfilled");
    const winnerIndex=attempts.indexOf(winner);
    const winningEmail=winnerIndex===0?"one@example.com":"two@example.com";
    const winningKey=winnerIndex===0?"booking-request-key-001":"booking-request-key-002";
    const bookingId=winner.value.bookingId;
    const retry=await domain.createBooking({...base,email:winningEmail,idempotencyKey:winningKey},null);
    assert.equal(retry.bookingId,bookingId);
    assert.equal(retry.reused,true);
    await assert.rejects(domain.createBooking({...base,email:"attacker@example.com",idempotencyKey:winningKey},null),/Kunci transaksi sudah digunakan/i,"an idempotency key must not reveal another guest booking");
    await assert.rejects(domain.availability("2099-02-31","2099-03-05",1),/Tanggal menginap tidak valid/i,"impossible calendar dates must be rejected");
    await domain.requestCancellation(bookingId,winningEmail,"Change of travel plan");
    const held=await domain.availability(checkIn,checkOut,1);
    assert.equal(held.find(x=>x.typeId==="RT001")?.canBook,false,"pending cancellation must continue to block the room");
    await domain.decideCancellation(admin,bookingId,true,"Approved by test");
    const released=await domain.availability(checkIn,checkOut,1);
    assert.equal(released.find(x=>x.typeId==="RT001")?.canBook,true,"approved cancellation releases inventory");
    const room=(await domain.listRooms())[0];
    await store.transaction(wb=>{const sheet=wb.getWorksheet("Rooms")!;for(let row=2;row<=sheet.rowCount;row++){if(String(sheet.getRow(row).getCell(1).value)===String(room.RoomID)){sheet.getRow(row).getCell(5).value="Maintenance";break;}}});
    await assert.rejects(domain.housekeeping(admin,String(room.RoomID),"Inspected"),/kamar maintenance/i,"housekeeping must not release a maintenance room");
    await store.transaction(wb=>{const sheet=wb.getWorksheet("Rooms")!;for(let row=2;row<=sheet.rowCount;row++){if(String(sheet.getRow(row).getCell(1).value)===String(room.RoomID)){sheet.getRow(row).getCell(5).value="Occupied";break;}}});
    const occupiedAvailability=await domain.availability(checkIn,checkOut,1);
    assert.equal(occupiedAvailability.find(x=>x.typeId==="RT001")?.canBook,false,"occupied room must never be offered as available");
    await assert.rejects(domain.housekeeping(admin,String(room.RoomID),"Inspected"),/kamar yang sedang ditempati/i,"housekeeping must not release an occupied room");
    const signedSession=domain.signSession(admin);
    assert.ok(domain.readSession(signedSession),"signed session must validate before account changes");
    await store.transaction(wb=>{const sheet=wb.getWorksheet("Users")!;sheet.getRow(2).getCell(4).value="admin";});
    assert.equal(await domain.isActiveActor(admin),false,"changing a staff role must invalidate the old session immediately");
    const status=await domain.workbookStatus();
    assert.equal(status.initialized,true);
    assert.ok(status.sheets.includes("Reservations"));
  } finally {
    await rm(dir,{recursive:true,force:true});
  }
});


test("XLSX preflight rejects oversized merged ranges and drawing anchors", () => {
  assert.throws(() => assertSafeXlsxXml("xl/worksheets/sheet1.xml", '<worksheet><mergeCells><mergeCell ref="A1:XFD1048576"/></mergeCells></worksheet>'), /oversized merged-cell range/i);
  assert.throws(() => assertSafeXlsxXml("xl/drawings/drawing1.xml", '<xdr:wsDr><xdr:from><xdr:col>300000000</xdr:col></xdr:from></xdr:wsDr>'), /out-of-range drawing column/i);
  assert.doesNotThrow(() => assertSafeXlsxXml("xl/worksheets/sheet1.xml", '<worksheet><mergeCells><mergeCell ref="A1:B2"/></mergeCells></worksheet>'));
});
