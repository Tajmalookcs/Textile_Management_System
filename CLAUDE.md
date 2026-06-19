# Claude Code — Textile Management System

## Project Overview
Textile Management System workspace. Currently contains Pakistan Customs Tariff FY 2025-26 (PDF).

## Permissions

### Allowed without confirmation
- Reading any file in this directory
- Running Python scripts for PDF extraction/processing
- Installing Python packages via pip
- Creating output files (txt, xlsx, csv, json) from PDF data

### Requires confirmation before proceeding
- Deleting any file
- Modifying the source PDF
- Pushing to any remote repository
- Any destructive operation

## Conventions
- Python is the preferred language for data extraction and processing
- Use `pdfplumber` for text/table extraction from PDFs
- Output extracted data to clearly named files (e.g., `tariff_chapter01.csv`)

## Notes
- Primary data file: `Tariff-2025-26.pdf` (Pakistan Customs Tariff FY 2025-26)
- PDF contains PCT codes, item descriptions, and customs duty (CD%) rates
