!macro customInstall
  DetailPrint "Setting up Counter-Strike 2 match tracking (GSI + JSI)..."
  ExecWait '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --install-game-integration' $0
  ${If} $0 != 0
    DetailPrint "CS2 integration will finish when Counter-Strike 2 is installed."
  ${Else}
    DetailPrint "CS2 integration installed."
  ${EndIf}
!macroend
