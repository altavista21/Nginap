# Instalasi Nginap di Komputer Hotel

## Catatan penting
Nginap versi ini berjalan sebagai aplikasi lokal pada komputer hotel. Excel adalah penyimpanan utama. Website publik di Vercel belum dapat terhubung langsung ke Excel di komputer hotel. Jangan membuka port 4100 ke internet dan jangan mengatur port forwarding router. Untuk menerima reservasi dari internet, perlu gateway/relay outbound dengan TLS dan identitas perangkat yang belum termasuk rilis ini.

Windows 10 sudah melewati akhir dukungan standar pada 14 Oktober 2025. Gunakan Windows yang masih didukung atau perangkat Windows 10 yang masih tercakup ESU aktif.

## Prasyarat
- Node.js 22 LTS (atau versi aktif yang kompatibel dengan Next.js 15).
- npm 10+.
- Komputer hotel dengan akun Windows khusus dan akses folder data terbatas.
- Jaringan dan browser modern.

## Persiapan
1. Clone repository ke komputer hotel.
2. Buka PowerShell pada folder Nginap.
3. Jalankan `Copy-Item .env.example .env`.
4. Buat dua secret acak. Contoh PowerShell:
   ```powershell
   [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
   ```
5. Isi `NGINAP_SESSION_SECRET` dengan secret pertama (minimal 32 karakter), `NGINAP_BOOTSTRAP_KEY` dengan secret kedua (minimal 24 karakter), dan sesuaikan `NGINAP_ALLOWED_ORIGIN=http://localhost:3000`.
6. Jalankan `npm install`.
7. Jalankan `npm run dev`.
8. Buka `http://localhost:3000` untuk tamu dan `http://localhost:3000/staff` untuk staf.

## Membuat superadmin pertama
Dengan service berjalan, buka PowerShell lain:
```powershell
$body = @{ username = "hoteladmin"; password = "GantiDenganPasswordPanjang!" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:4100/api/auth/bootstrap -Headers @{"x-bootstrap-key"="ISI_NGINAP_BOOTSTRAP_KEY"} -ContentType "application/json" -Body $body
```
Segera hapus `NGINAP_BOOTSTRAP_KEY` dari file `.env` setelah akun pertama dibuat, lalu restart service. Buat akun admin dan resepsionis dari superadmin melalui API `POST /api/staff` (fitur UI manajemen akun menyusul).

## Data hotel
- Workbook dibuat otomatis pada `apps/local-server/data/NGINAP_DATABASE.xlsx` (atau `NGINAP_DATA_DIR`).
- Backup dibuat sebelum setiap transaksi pada folder `backups`.
- Masukkan nomor kamar aktual dan tarif tiap kategori dari menu Inventaris/Tarif pada dashboard admin.
- Jangan buka workbook di Excel saat service berjalan. Gunakan tombol Ekspor Excel untuk mengambil salinan baca.
- Simpan backup tambahan terenkripsi ke media terpisah dan uji pemulihan sebelum operasional.

## API
Health: `GET /health`. Endpoint lain dijelaskan dalam PRD dan source `apps/local-server/src/index.ts`.

## Belum boleh dipakai untuk produksi publik
Sebelum go-live, wajib menyelesaikan relay internet aman, uji build/CI, uji Windows, pemulihan backup, file lock, disk penuh, keamanan, dan UAT hotel. Booking hanya aman bila semua request reservasi masuk ke satu service instance yang sama.
