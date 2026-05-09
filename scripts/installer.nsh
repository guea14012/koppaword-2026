; KOPPAWORD 2026 - Custom NSIS installer script
; This file is included by electron-builder's NSIS config.
; It handles .kwdoc file association on Windows.

!macro customInstall
  ; Register .kwdoc file type
  WriteRegStr HKCU "Software\Classes\.kwdoc"                              ""  "KoppaWord.Document"
  WriteRegStr HKCU "Software\Classes\.kwdoc"                              "Content Type" "application/x-kwdoc"
  WriteRegStr HKCU "Software\Classes\KoppaWord.Document"                  ""  "KOPPAWORD 2026 Document"
  WriteRegStr HKCU "Software\Classes\KoppaWord.Document\DefaultIcon"      ""  "$INSTDIR\resources\assets\kwdoc.ico"
  WriteRegStr HKCU "Software\Classes\KoppaWord.Document\shell\open\command" "" '"$INSTDIR\KOPPAWORD 2026.exe" "%1"'

  ; Refresh Windows file associations
  System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend

!macro customUnInstall
  ; Remove .kwdoc file type registration
  DeleteRegKey HKCU "Software\Classes\.kwdoc"
  DeleteRegKey HKCU "Software\Classes\KoppaWord.Document"
  System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend

!macro customHeader
  !system "echo Installing KOPPAWORD 2026..."
!macroend
