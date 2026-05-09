# KOPPAWORD 2026 — Installation Guide

## สำหรับผู้ใช้ทั่วไป (End Users)

เมื่อ build เสร็จแล้ว ผู้ใช้แค่ดับเบิ้ลคลิก installer ที่ได้:

```
release/1.0.0/
  KOPPAWORD 2026 Setup 1.0.0.exe   ← ติดตั้งปกติ (มี wizard)
  KOPPAWORD 2026 1.0.0.exe          ← Portable (ไม่ต้องติดตั้ง)
```

สิ่งที่ installer ทำให้อัตโนมัติ:
- ✅ เลือก installation directory ได้
- ✅ สร้าง shortcut บน Desktop
- ✅ เพิ่มใน Start Menu > KoppaZZZ
- ✅ ลงทะเบียน `.kwdoc` file type (ดับเบิ้ลคลิกไฟล์เปิดได้เลย)
- ✅ เพิ่มใน Programs & Features (ถอนการติดตั้งได้)
- ✅ ทำงาน offline ได้ (AI ต้องมี API key เท่านั้น)

---

## สำหรับ Developer — Build จาก Source

### Prerequisites

```powershell
# 1. Node.js 18+
winget install OpenJS.NodeJS.LTS

# 2. Windows Build Tools (สำหรับ better-sqlite3 native module)
npm install --global windows-build-tools
# หรือ
npm install --global @electron/rebuild
```

### ขั้นตอนทำ icon (ทำครั้งเดียว)

```powershell
# ติดตั้ง tool แปลง PNG → ICO
npm install -g png-to-ico

# สร้าง icons ทั้งหมด
npm run make:icons

# แปลงเป็น ICO (Windows)
png-to-ico assets/icon-256.png | Set-Content -Encoding Byte assets/icon.ico
png-to-ico assets/kwdoc.png    | Set-Content -Encoding Byte assets/kwdoc.ico
```

### Build installer (.exe)

```powershell
# วิธีที่ 1: ใช้ PowerShell script (แนะนำ)
.\scripts\build.ps1

# วิธีที่ 2: ทำทีละขั้น
npm install
npm run build        # Vite build + Electron compile
npx electron-builder --win   # สร้าง installer

# ผลลัพธ์อยู่ใน:
# release/1.0.0/KOPPAWORD 2026 Setup 1.0.0.exe
```

### Build สำหรับ platform อื่น

```powershell
# Linux (AppImage + .deb + .rpm)
npm run build:linux

# macOS (DMG) — ต้องทำบน Mac
npm run build:mac

# ทุก platform พร้อมกัน
npm run build:all
```

---

## Development Mode (ไม่ต้อง build)

```powershell
# Terminal เดียว — Electron + Vite devserver
npm run electron:dev
```

ไม่ต้องรัน backend แยกแล้ว! ทุกอย่าง (SQLite, AI) อยู่ใน Electron main process

---

## ตั้งค่า AI Features

1. เปิดแอป → คลิก **Bot icon** (Ctrl+Shift+A)
2. คลิก 🔑 icon มุมขวาบน AI panel
3. ใส่ Anthropic API key: `sk-ant-...`
4. คลิก **"Save Key Securely"**

Key จะถูกเก็บใน Electron's secure store บนเครื่อง — ไม่ส่งออกไปไหน

หรือตั้ง environment variable:
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
```

---

## ที่เก็บข้อมูล

| ข้อมูล | ตำแหน่ง |
|--------|---------|
| Documents (SQLite) | `%APPDATA%\koppaword-2026\data\documents.db` |
| Settings | `%APPDATA%\koppaword-2026\config.json` |
| Recovery files | `%APPDATA%\koppaword-2026\recovery\` |

---

## Uninstall

**แบบ installer:** Control Panel → Programs → KOPPAWORD 2026 → Uninstall

**แบบ manual:**
```powershell
# ลบ app data (optional)
Remove-Item "$env:APPDATA\koppaword-2026" -Recurse -Force
```

---

## Troubleshooting

**`better-sqlite3` build error:**
```powershell
npm install --global @electron/rebuild
npx electron-rebuild -f -w better-sqlite3
```

**ไฟล์ icon หาย:**
```powershell
npm run make:icons
png-to-ico assets/icon-256.png | Set-Content -Encoding Byte assets/icon.ico
```

**Electron ไม่ขึ้นหน้าต่าง:**
```powershell
npm run dev  # เช็ค Vite ก่อน
```

**AI ไม่ทำงาน:**
- เช็ค API key ใน AI panel
- ดู Console (Ctrl+Shift+I ใน dev mode)
- ตรวจสอบ internet connection
