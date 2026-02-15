@echo off
echo [INIT] Creating shared_memory folder structure...

set folders=0_BE_input 0_BE_out 1_EC_out 2_OBJ_DET_out 3_FED_out 4_CEX_out 5_JSON_out 6_AG_out 7_PDFG_out 8_History

for %%F in (%folders%) do (
    if not exist shared_memory\%%F (
        mkdir shared_memory\%%F
        echo [NEW] Created: shared_memory\%%F
    ) else (
        echo [EXISTS] shared_memory\%%F
    )
    echo. > shared_memory\%%F\.gitkeep
)

echo [DONE] All required shared_memory subfolders are present.
