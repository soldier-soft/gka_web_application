#!/usr/bin/env python3
"""
GKA Construction quotation & invoice document generator.

Supports both:
1. Template-based filling using an existing DOCX template (preserving artwork, header, footer, bank details, seal, and signature).
2. Dynamic high-fidelity document generation from scratch when no template file is present.

Install:
    python -m pip install python-docx

Usage:
    python gka_document_generator.py --data sample_quotation.json --output Quotation_0910VIVA.docx
    python gka_document_generator.py --data sample_invoice.json --type invoice --output Invoice_INV2026001.docx
"""

from __future__ import annotations

import argparse
import json
import sys
from copy import deepcopy
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

DEFAULT_TEMPLATE = "GKA_Construction_Quotation_Revised_Editable.docx"

# Official GKA Brand Color Palette
NAVY_HEX = "0F254B"
GOLD_HEX = "D6A21D"
LIGHT_BLUE_HEX = "EAF2F8"
SLATE_GRAY_HEX = "475569"
BORDER_GRAY_HEX = "CBD5E1"


def dec(value: Any) -> Decimal:
    """Convert a JSON number/string to Decimal safely."""
    if value is None:
        return Decimal("0.00")
    return Decimal(str(value))


def money(value: Decimal) -> str:
    """Format INR with Indian comma grouping and two decimal places."""
    value = value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    whole, fraction = f"{value:.2f}".split(".")
    if len(whole) > 3:
        last3 = whole[-3:]
        rest = whole[:-3]
        groups = []
        while len(rest) > 2:
            groups.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.insert(0, rest)
        whole = ",".join(groups + [last3])
    return f"{whole}.{fraction}"


def number_to_words_indian(number: int) -> str:
    """Convert a non-negative integer to English words using lakh/crore units."""
    if number == 0:
        return "Zero"

    ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
        "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
        "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    ]
    tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
        "Eighty", "Ninety",
    ]

    def under_1000(n: int) -> str:
        words = []
        if n >= 100:
            words.extend([ones[n // 100], "Hundred"])
            n %= 100
        if n >= 20:
            words.append(tens[n // 10])
            n %= 10
        if n:
            words.append(ones[n])
        return " ".join(words)

    parts = []
    for unit, divisor in (
        ("Crore", 10_000_000),
        ("Lakh", 100_000),
        ("Thousand", 1_000),
        ("", 1),
    ):
        chunk = number // divisor
        number %= divisor
        if chunk:
            if unit == "":
                parts.append(under_1000(chunk))
            else:
                parts.append(f"{number_to_words_indian(chunk)} {unit}")
    return " ".join(parts)


def amount_in_words(amount: Decimal) -> str:
    rounded = amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    rupees = int(rounded)
    paise = int((rounded - Decimal(rupees)) * 100)
    result = f"Rupees {number_to_words_indian(rupees)}"
    if paise:
        result += f" and {number_to_words_indian(paise)} Paise"
    return result + " Only."


def set_run_text_preserve_style(paragraph, text: str, run_index: int = 0) -> None:
    """Replace paragraph text while retaining the selected run's formatting."""
    if paragraph.runs:
        chosen = paragraph.runs[min(run_index, len(paragraph.runs) - 1)]
        for run in paragraph.runs:
            run.text = ""
        chosen.text = text
    else:
        paragraph.add_run(text)


def set_cell_text_preserve_style(cell, text: str, run_index: int = 0) -> None:
    """Replace cell content while retaining its first paragraph/run styling."""
    if not cell.paragraphs:
        cell.add_paragraph()
    first = cell.paragraphs[0]
    set_run_text_preserve_style(first, text, run_index=run_index)
    for p in list(cell.paragraphs)[1:]:
        p._element.getparent().remove(p._element)


def set_labeled_cell_value(cell, label: str, value: str) -> None:
    """Keep a label on the first line and replace the editable value below it."""
    p = cell.paragraphs[0]
    if len(p.runs) >= 2:
        p.runs[0].text = label + "\n"
        for run in p.runs[1:]:
            run.text = ""
        p.runs[1].text = value
    else:
        set_run_text_preserve_style(p, label + "\n" + value)


def replace_amount_words(doc, words: str) -> None:
    for paragraph in doc.paragraphs:
        if "AMOUNT IN WORDS:" in paragraph.text:
            prefix = "AMOUNT IN WORDS:"
            if len(paragraph.runs) >= 2:
                paragraph.runs[0].text = prefix + " "
                for run in paragraph.runs[1:]:
                    run.text = ""
                paragraph.runs[1].text = words
            else:
                set_run_text_preserve_style(paragraph, prefix + " " + words)
            return


def clone_table_row(table, source_row_index: int):
    """Append a copy of a row, preserving its cell styles and borders."""
    source = table.rows[source_row_index]._tr
    new_tr = deepcopy(source)
    table._tbl.append(new_tr)
    return table.rows[-1]


def remove_table_row(table, row_index: int) -> None:
    tr = table.rows[row_index]._tr
    tr.getparent().remove(tr)


def set_cell_shading(cell, color_hex: str):
    """Set background color of a cell."""
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))


def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set inner padding for a table cell in dxa (1/20 pt)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in (('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)):
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)


def create_dynamic_document(data: dict[str, Any], doc_type: str = "quotation") -> Document:
    """
    Builds the complete GKA Construction Quotation or Tax Invoice DOCX
    matching the exact visual layout, color palette, and tables of the reference image.
    """
    doc = Document()

    # 0.5 inch margins around document
    for section in doc.sections:
        section.top_margin = Inches(0.4)
        section.bottom_margin = Inches(0.4)
        section.left_margin = Inches(0.5)
        section.right_margin = Inches(0.5)

    # 1. TOP HEADER TABLE: Logo & Company on Left | Registered Office & GSTIN on Right
    header_table = doc.add_table(rows=1, cols=2)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_table.autofit = False

    cell_left = header_table.cell(0, 0)
    cell_left.width = Inches(4.3)
    p_logo = cell_left.paragraphs[0]
    p_logo.paragraph_format.space_after = Pt(2)
    run_name = p_logo.add_run("GKA CONSTRUCTION\n")
    run_name.font.name = "Arial"
    run_name.font.size = Pt(20)
    run_name.font.bold = True
    run_name.font.color.rgb = RGBColor(15, 37, 75)  # Navy #0F254B

    run_tagline = p_logo.add_run("BUILDING TRUST. DELIVERING QUALITY.\n")
    run_tagline.font.name = "Arial"
    run_tagline.font.size = Pt(8.5)
    run_tagline.font.bold = True
    run_tagline.font.color.rgb = RGBColor(214, 162, 29)  # Gold #D6A21D

    # 4 Service Pillars
    run_pillars = p_logo.add_run(
        "■ BUILDING CONSTRUCTION   ■ RENOVATION & DESIGNING   ■ FULL HOME CONTRACTS   ■ ALLIED WORKS"
    )
    run_pillars.font.name = "Arial"
    run_pillars.font.size = Pt(6.5)
    run_pillars.font.bold = True
    run_pillars.font.color.rgb = RGBColor(71, 85, 105)

    cell_right = header_table.cell(0, 1)
    cell_right.width = Inches(3.2)
    p_right = cell_right.paragraphs[0]
    p_right.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_right.paragraph_format.space_after = Pt(2)

    r_reg = p_right.add_run("Registered Office:\n")
    r_reg.font.size = Pt(8)
    r_reg.font.bold = True
    r_reg.font.color.rgb = RGBColor(15, 37, 75)

    r_addr = p_right.add_run("No. 965, Pillaiyar Kovil St, Theppanandhal, Kelur,\nTiruvannamalai District, Tamil Nadu – 606907\n")
    r_addr.font.size = Pt(7.5)
    r_addr.font.color.rgb = RGBColor(71, 85, 105)

    r_tax = p_right.add_run("GSTIN: 33CDYPA3555M2ZZ | PAN NO: CDYPA3555M\nMobile: 8838030917 | Email: gkaconstruction51@gmail.com\nWebsite: www.gkaconstruction.com")
    r_tax.font.size = Pt(7.5)
    r_tax.font.bold = True
    r_tax.font.color.rgb = RGBColor(15, 37, 75)

    # 2. DOCUMENT RIBBON (QUOTATION / TAX INVOICE)
    p_gap = doc.add_paragraph()
    p_gap.paragraph_format.space_before = Pt(4)
    p_gap.paragraph_format.space_after = Pt(4)

    ribbon_table = doc.add_table(rows=1, cols=1)
    ribbon_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    ribbon_cell = ribbon_table.cell(0, 0)
    ribbon_cell.width = Inches(7.5)
    set_cell_shading(ribbon_cell, NAVY_HEX)
    set_cell_margins(ribbon_cell, top=100, bottom=100, left=200, right=200)

    p_ribbon = ribbon_cell.paragraphs[0]
    p_ribbon.alignment = WD_ALIGN_PARAGRAPH.CENTER
    is_neg = bool(data.get("is_negotiated"))
    if doc_type == "quotation":
        doc_title = "NEGOTIATED QUOTATION" if is_neg else "QUOTATION"
    else:
        doc_title = "NEGOTIATED TAX INVOICE" if is_neg else "TAX INVOICE"
    r_title = p_ribbon.add_run(doc_title)
    r_title.font.name = "Arial Black"
    r_title.font.size = Pt(14)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(255, 255, 255)

    # 3. QUOTATION NO. & DATE TABLE
    doc_num_label = "QUOTATION NO." if doc_type == "quotation" else "INVOICE NO."
    doc_num_val = str(data.get("quotation_number") or data.get("invoice_number") or "0910VIVA")
    doc_date_val = str(data.get("date") or data.get("issue_date") or "09 October 2026")

    meta_table = doc.add_table(rows=1, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    m_cell1 = meta_table.cell(0, 0)
    m_cell1.width = Inches(4.5)
    p_m1 = m_cell1.paragraphs[0]
    p_m1.paragraph_format.space_after = Pt(2)
    r_m1_lbl = p_m1.add_run(f"{doc_num_label}\n")
    r_m1_lbl.font.size = Pt(8)
    r_m1_lbl.font.bold = True
    r_m1_lbl.font.color.rgb = RGBColor(100, 116, 139)
    r_m1_val = p_m1.add_run(doc_num_val)
    r_m1_val.font.size = Pt(11)
    r_m1_val.font.bold = True
    r_m1_val.font.color.rgb = RGBColor(15, 37, 75)

    m_cell2 = meta_table.cell(0, 1)
    m_cell2.width = Inches(3.0)
    p_m2 = m_cell2.paragraphs[0]
    p_m2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_m2.paragraph_format.space_after = Pt(2)
    r_m2_lbl = p_m2.add_run("DATE\n")
    r_m2_lbl.font.size = Pt(8)
    r_m2_lbl.font.bold = True
    r_m2_lbl.font.color.rgb = RGBColor(100, 116, 139)
    r_m2_val = p_m2.add_run(doc_date_val)
    r_m2_val.font.size = Pt(11)
    r_m2_val.font.bold = True
    r_m2_val.font.color.rgb = RGBColor(15, 37, 75)

    # 4. TO & FROM BOX (Two Columns with Light Blue Border)
    to_from_table = doc.add_table(rows=1, cols=2)
    to_from_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Left Cell: TO
    c_to = to_from_table.cell(0, 0)
    c_to.width = Inches(4.2)
    set_cell_shading(c_to, "F8FAFC")
    set_cell_margins(c_to, top=120, bottom=120, left=150, right=150)
    p_to = c_to.paragraphs[0]
    p_to.paragraph_format.space_after = Pt(2)
    r_to_lbl = p_to.add_run("👤 TO:\n")
    r_to_lbl.font.size = Pt(9)
    r_to_lbl.font.bold = True
    r_to_lbl.font.color.rgb = RGBColor(214, 162, 29)

    client_data = data.get("client", {})
    to_name = str(client_data.get("contact") or data.get("clientContactPerson") or data.get("client_name") or "THE CHIEF ENGINEER")
    to_company = str(client_data.get("company") or data.get("clientCompany") or "VIVANTHA HOTEL")
    to_addr1 = str(client_data.get("address_line1") or data.get("siteLocation") or "SHOLINGANALUR,")
    to_addr2 = str(client_data.get("address_line2") or "CHENNAI.")
    client_gstin = str(client_data.get("gstin") or data.get("clientGstin") or data.get("gstin") or "")

    addr_runs = f"{to_name}\n{to_company}\n{to_addr1}\n{to_addr2}"
    if client_gstin and client_gstin.strip():
        addr_runs += f"\nGSTIN: {client_gstin.strip().upper()}"
    r_to_body = p_to.add_run(addr_runs)
    r_to_body.font.size = Pt(8.5)
    r_to_body.font.bold = True
    r_to_body.font.color.rgb = RGBColor(15, 37, 75)

    # Right Cell: FROM
    c_from = to_from_table.cell(0, 1)
    c_from.width = Inches(3.3)
    set_cell_shading(c_from, "F8FAFC")
    set_cell_margins(c_from, top=120, bottom=120, left=150, right=150)
    p_from = c_from.paragraphs[0]
    p_from.paragraph_format.space_after = Pt(2)
    r_from_lbl = p_from.add_run("👤 FROM:\n")
    r_from_lbl.font.size = Pt(9)
    r_from_lbl.font.bold = True
    r_from_lbl.font.color.rgb = RGBColor(214, 162, 29)

    sender_data = data.get("sender", {})
    from_name = str(sender_data.get("name") or data.get("senderName") or "HARI A")
    from_company = str(sender_data.get("company") or data.get("senderCompany") or "GKA CONSTRUCTION")
    r_from_body = p_from.add_run(f"{from_name}\n{from_company}")
    r_from_body.font.size = Pt(8.5)
    r_from_body.font.bold = True
    r_from_body.font.color.rgb = RGBColor(15, 37, 75)

    # 5. SUBJECT LINE
    subject_text = str(
        data.get("subject")
        or f"{doc_title} for Construction Works – Cooling Tower Base & Related Structures."
    )
    p_subj = doc.add_paragraph()
    p_subj.paragraph_format.space_before = Pt(6)
    p_subj.paragraph_format.space_after = Pt(6)
    r_sub_lbl = p_subj.add_run("📄 SUBJECT: ")
    r_sub_lbl.font.size = Pt(9)
    r_sub_lbl.font.bold = True
    r_sub_lbl.font.color.rgb = RGBColor(214, 162, 29)
    r_sub_txt = p_subj.add_run(subject_text)
    r_sub_txt.font.size = Pt(9)
    r_sub_txt.font.bold = True
    r_sub_txt.font.color.rgb = RGBColor(15, 37, 75)

    # 6. ITEMS TABLE
    items = data.get("items", [])
    if not items:
        items = [
            {"description": "Cooling tower concrete base Horizontal beam: 1x0.75x 20", "qty": 160, "unit": "CFT", "rate": 1400},
            {"description": "Vertical columns: 0.8x 0.8", "qty": 65, "unit": "CFT", "rate": 1450},
            {"description": "Service platform: 0.5 x3 x25", "qty": 1, "unit": "LOT", "rate": 50000},
            {"description": "Platform support beams: 0.8x3", "qty": 1, "unit": "LOT", "rate": 71000},
        ]

    # Create Items Table: Header + Items
    table = doc.add_table(rows=1, cols=6)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    headers = ["SL. NO.", "DESCRIPTION", "QTY", "UNIT", "RATE (₹)", "AMOUNT (₹)"]
    widths = [Inches(0.7), Inches(3.3), Inches(0.7), Inches(0.7), Inches(1.0), Inches(1.1)]

    hdr_row = table.rows[0]
    for col_idx, (title, w) in enumerate(zip(headers, widths)):
        cell = hdr_row.cells[col_idx]
        cell.width = w
        set_cell_shading(cell, NAVY_HEX)
        set_cell_margins(cell, top=80, bottom=80, left=80, right=80)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if col_idx in (2, 4, 5) else (WD_ALIGN_PARAGRAPH.CENTER if col_idx in (0, 3) else WD_ALIGN_PARAGRAPH.LEFT)
        r = p.add_run(title)
        r.font.name = "Arial"
        r.font.size = Pt(8)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    subtotal = Decimal("0.00")
    for idx, item in enumerate(items, start=1):
        row = table.add_row()
        qty = dec(item.get("qty") or item.get("quantity") or 1)
        rate = dec(item.get("rate") or item.get("unitRateRupees") or (dec(item.get("unitRatePaise", 0)) / 100))
        amt = dec(item.get("amount") or item.get("amountRupees") or (dec(item.get("amountPaise", 0)) / 100))
        if amt == 0 and qty > 0 and rate > 0:
            amt = qty * rate
        subtotal += amt

        values = [
            f"{idx}.",
            str(item.get("description", "")).strip(),
            f"{qty:g}",
            str(item.get("unit", "CFT")).upper().strip(),
            money(rate),
            money(amt),
        ]
        for col_idx, (val, w) in enumerate(zip(values, widths)):
            cell = row.cells[col_idx]
            cell.width = w
            set_cell_margins(cell, top=60, bottom=60, left=60, right=60)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if col_idx in (2, 4, 5) else (WD_ALIGN_PARAGRAPH.CENTER if col_idx in (0, 3) else WD_ALIGN_PARAGRAPH.LEFT)
            r = p.add_run(val)
            r.font.size = Pt(8)
            r.font.color.rgb = RGBColor(15, 37, 75)
            if col_idx == 1:
                r.font.bold = True

    # 7. TOTALS TABLE (Right Aligned)
    is_neg = bool(data.get("is_negotiated"))
    disc_val = dec(data.get("negotiated_discount") or data.get("discount") or 0)
    taxable_subtotal = max(Decimal("0.00"), subtotal - disc_val) if is_neg else subtotal

    gst_percent = dec(data.get("gst_percent") or data.get("taxRatePercent") or 18)
    gst_amount = (taxable_subtotal * gst_percent / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    grand_total = taxable_subtotal + gst_amount

    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(4)
    p_space.paragraph_format.space_after = Pt(2)

    if is_neg and disc_val > 0:
        labels = [
            "GROSS ESTIMATE" if doc_type == "quotation" else "GROSS BILL AMOUNT",
            "LESS: NEGOTIATED DISCOUNT",
            "TAXABLE VALUE",
            f"TAXES / GST ({gst_percent:g}%)",
            "NET NEGOTIATED TOTAL",
        ]
        amounts = [
            f"₹ {money(subtotal)}",
            f"- ₹ {money(disc_val)}",
            f"₹ {money(taxable_subtotal)}",
            f"₹ {money(gst_amount)}",
            f"₹ {money(grand_total)}",
        ]
    else:
        labels = ["TOTAL AMOUNT", f"TAXES / GST ({gst_percent:g}%)", "GRAND TOTAL"]
        amounts = [f"₹ {money(subtotal)}", f"₹ {money(gst_amount)}", f"₹ {money(grand_total)}"]

    totals_table = doc.add_table(rows=len(labels), cols=2)
    totals_table.alignment = WD_TABLE_ALIGNMENT.RIGHT

    for row_idx, (lbl, amt) in enumerate(zip(labels, amounts)):
        row = totals_table.rows[row_idx]
        c0 = row.cells[0]
        c1 = row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(1.6)

        set_cell_margins(c0, top=50, bottom=50, left=80, right=80)
        set_cell_margins(c1, top=50, bottom=50, left=80, right=80)

        p0 = c0.paragraphs[0]
        p1 = c1.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT

        if row_idx == len(labels) - 1:
            set_cell_shading(c0, NAVY_HEX)
            set_cell_shading(c1, NAVY_HEX)
            r0 = p0.add_run(lbl)
            r0.font.bold = True
            r0.font.size = Pt(9.5)
            r0.font.color.rgb = RGBColor(255, 255, 255)

            r1 = p1.add_run(amt)
            r1.font.bold = True
            r1.font.size = Pt(10)
            r1.font.color.rgb = RGBColor(255, 255, 255)
        elif "DISCOUNT" in lbl:
            r0 = p0.add_run(lbl)
            r0.font.bold = True
            r0.font.size = Pt(8.5)
            r0.font.color.rgb = RGBColor(5, 150, 105)

            r1 = p1.add_run(amt)
            r1.font.bold = True
            r1.font.size = Pt(8.5)
            r1.font.color.rgb = RGBColor(5, 150, 105)
        else:
            r0 = p0.add_run(lbl)
            r0.font.bold = True
            r0.font.size = Pt(8.5)
            r0.font.color.rgb = RGBColor(71, 85, 105)

            r1 = p1.add_run(amt)
            r1.font.bold = True
            r1.font.size = Pt(8.5)
            r1.font.color.rgb = RGBColor(15, 37, 75)

    # 8. AMOUNT IN WORDS BOX
    words_p = doc.add_paragraph()
    words_p.paragraph_format.space_before = Pt(8)
    words_p.paragraph_format.space_after = Pt(4)
    r_aw_lbl = words_p.add_run("📋 AMOUNT IN WORDS:  ")
    r_aw_lbl.font.size = Pt(8.5)
    r_aw_lbl.font.bold = True
    r_aw_lbl.font.color.rgb = RGBColor(214, 162, 29)

    r_aw_val = words_p.add_run(amount_in_words(grand_total))
    r_aw_val.font.size = Pt(8.5)
    r_aw_val.font.bold = True
    r_aw_val.font.color.rgb = RGBColor(15, 37, 75)

    # 8.5 CLIENT PORTAL CREDENTIALS BANNER
    client_name = data.get("client_name") or data.get("client", {}).get("name") or "client"
    clean_client_uname = "".join(c for c in client_name.lower() if c.isalnum()) or "client"
    client_username = data.get("client_portal_username") or data.get("clientPortalUsername") or f"{clean_client_uname}@gkaconstruction.com"
    client_password = data.get("client_portal_password") or data.get("clientPortalPassword") or "GKAclient2026!"

    portal_p = doc.add_paragraph()
    portal_p.paragraph_format.space_before = Pt(4)
    portal_p.paragraph_format.space_after = Pt(6)
    r_p_hdr = portal_p.add_run("🔐 CLIENT PORTAL WORKSPACE ACCESS CREDENTIALS:  ")
    r_p_hdr.font.size = Pt(8)
    r_p_hdr.font.bold = True
    r_p_hdr.font.color.rgb = RGBColor(30, 64, 175)

    r_p_info = portal_p.add_run(f"Link: https://www.gkaconstruction.com/client-portal  |  Username: {client_username}  |  Password: {client_password}")
    r_p_info.font.size = Pt(8)
    r_p_info.font.bold = True
    r_p_info.font.color.rgb = RGBColor(15, 37, 75)

    # 8.8 DEDICATED OFFICIAL BILL NOTES (IF PRESENT)
    user_notes = data.get("negotiated_notes") or data.get("notes")
    if user_notes and str(user_notes).strip():
        notes_p = doc.add_paragraph()
        notes_p.paragraph_format.space_before = Pt(2)
        notes_p.paragraph_format.space_after = Pt(6)
        r_n_hdr = notes_p.add_run("📝 OFFICIAL BILL NOTES & SETTLEMENT:  ")
        r_n_hdr.font.size = Pt(8)
        r_n_hdr.font.bold = True
        r_n_hdr.font.color.rgb = RGBColor(180, 83, 9)

        r_n_body = notes_p.add_run(str(user_notes).strip())
        r_n_body.font.size = Pt(8)
        r_n_body.font.color.rgb = RGBColor(15, 37, 75)

    # 9. BOTTOM DUAL SECTION: Bank Details (Left) & Terms & Conditions + Seal/Signature (Right)
    bottom_table = doc.add_table(rows=1, cols=2)
    bottom_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    bottom_table.autofit = False

    # Left: Bank Details
    b_left = bottom_table.cell(0, 0)
    b_left.width = Inches(3.7)
    set_cell_shading(b_left, "F8FAFC")
    set_cell_margins(b_left, top=100, bottom=100, left=120, right=120)

    p_bhdr = b_left.paragraphs[0]
    p_bhdr.paragraph_format.space_after = Pt(4)
    r_bhdr = p_bhdr.add_run("🏦 BANK DETAILS\n")
    r_bhdr.font.size = Pt(9)
    r_bhdr.font.bold = True
    r_bhdr.font.color.rgb = RGBColor(15, 37, 75)

    bank_info = (
        "BENEFICIARY NAME   : GKA CONSTRUCTION\n"
        "ACCOUNT NUMBER     : 23330200002362\n"
        "BANK NAME          : FEDERAL BANK\n"
        "IFSC CODE          : FDRL0002333\n"
        "MICR CODE          : 606049002\n"
        "MOBILE NUMBER      : 8838030917\n"
        "ALTERNATE NUMBER   : 8940455917\n"
        "MAIL ID            : GKACONSTRUCTION51@GMAIL.COM\n"
        "WEBSITE            : WWW.GKACONSTRUCTION.COM"
    )
    r_binfo = p_bhdr.add_run(bank_info)
    r_binfo.font.name = "Consolas"
    r_binfo.font.size = Pt(7)
    r_binfo.font.color.rgb = RGBColor(30, 41, 59)

    # Right: Terms & Conditions + Signature
    b_right = bottom_table.cell(0, 1)
    b_right.width = Inches(3.8)
    set_cell_shading(b_right, "F8FAFC")
    set_cell_margins(b_right, top=100, bottom=100, left=120, right=120)

    p_terms = b_right.paragraphs[0]
    p_terms.paragraph_format.space_after = Pt(2)
    r_thdr = p_terms.add_run("📋 TERMS & CONDITIONS:\n")
    r_thdr.font.size = Pt(9)
    r_thdr.font.bold = True
    r_thdr.font.color.rgb = RGBColor(15, 37, 75)

    custom_terms = data.get("terms_and_conditions")
    if custom_terms and isinstance(custom_terms, list) and len(custom_terms) > 0:
        terms_list = [t if t.startswith("•") else f"• {t}" for t in custom_terms]
    elif doc_type == "invoice":
        terms_list = [
            "• Payment is due within 14 calendar days from the date of invoice issuance.",
            "• Please quote this Invoice Number when executing electronic bank transfers.",
            "• Statutory GST (18%) charged as per GSTIN compliance rules.",
            "• Late payment charges / interest @ 18% per annum will apply on overdue balances.",
            "• All billing disputes and claims subject to Chennai legal jurisdiction only.",
        ]
    else:
        terms_list = [
            "• This quotation is valid for 15 days from the date of issue.",
            "• Payment terms will be mutually agreed as per milestone schedule.",
            "• GST applicable as per government norms.",
            "• Work will be executed as per the agreed specifications and site conditions.",
        ]

    r_tinfo = p_terms.add_run("\n".join(terms_list[:5]) + "\n\n")
    r_tinfo.font.size = Pt(7)
    r_tinfo.font.color.rgb = RGBColor(71, 85, 105)

    # Signature and Seal Graphic representation
    p_sig = b_right.add_paragraph()
    p_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_sign = p_sig.add_run("Hari A\n")
    r_sign.font.name = "Segoe Script"
    r_sign.font.size = Pt(13)
    r_sign.font.bold = True
    r_sign.font.color.rgb = RGBColor(15, 37, 75)

    r_siglbl = p_sig.add_run("For GKA CONSTRUCTION\nProprietor / Authorized Signatory\n[Statutory Seal Affixed]")
    r_siglbl.font.size = Pt(7.5)
    r_siglbl.font.bold = True
    r_siglbl.font.color.rgb = RGBColor(100, 116, 139)

    # 10. BOTTOM FOOTER BANNER
    p_foot = doc.add_paragraph()
    p_foot.paragraph_format.space_before = Pt(8)
    p_foot.paragraph_format.space_after = Pt(0)
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER

    r_f1 = p_foot.add_run("📞 8838030917   ✉ gkaconstruction51@gmail.com   🌐 www.gkaconstruction.com        ")
    r_f1.font.size = Pt(7.5)
    r_f1.font.bold = True
    r_f1.font.color.rgb = RGBColor(71, 85, 105)

    r_f2 = p_foot.add_run("QUALITY CONSTRUCTION FOR A BETTER TOMORROW")
    r_f2.font.size = Pt(7.5)
    r_f2.font.bold = True
    r_f2.font.color.rgb = RGBColor(214, 162, 29)

    return doc


def generate_document(data: dict[str, Any], template_path: Path | None, output_path: Path, doc_type: str = "quotation") -> None:
    """
    Main entry point: If template exists, populate it; otherwise dynamically construct the styled DOCX.
    """
    if template_path and template_path.exists():
        doc = Document(str(template_path))
        if len(doc.tables) >= 4:
            # Table 0: number and date
            num_label = "QUOTATION NO." if doc_type == "quotation" else "INVOICE NO."
            num_val = str(data.get("quotation_number") or data.get("invoice_number") or "0910VIVA")
            date_val = str(data.get("date") or data.get("issue_date") or "09 October 2026")
            set_labeled_cell_value(doc.tables[0].cell(0, 0), num_label, num_val)
            set_labeled_cell_value(doc.tables[0].cell(0, 1), "DATE", date_val)

            # Table 1: client and sender
            client_lines = data.get("client", {})
            sender_lines = data.get("sender", {})
            client_text = "\n".join(
                str(x).strip()
                for x in [
                    client_lines.get("contact", "THE CHIEF ENGINEER"),
                    client_lines.get("company", "VIVANTHA HOTEL"),
                    client_lines.get("address_line1", "SHOLINGANALUR,"),
                    client_lines.get("address_line2", "CHENNAI."),
                ]
                if str(x).strip()
            )
            sender_text = "\n".join(
                str(x).strip()
                for x in [
                    sender_lines.get("name", "HARI A"),
                    sender_lines.get("company", "GKA CONSTRUCTION"),
                ]
                if str(x).strip()
            )
            set_labeled_cell_value(doc.tables[1].cell(0, 0), "TO:", client_text)
            set_labeled_cell_value(doc.tables[1].cell(0, 1), "FROM:", sender_text)

            # Table 2: line items
            items = data.get("items", [])
            subtotal = set_item_rows(doc.tables[2], items)

            # Table 3: totals
            gst_percent = dec(data.get("gst_percent", 18))
            gst_amount = (subtotal * gst_percent / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            grand_total = subtotal + gst_amount

            totals_table = doc.tables[3]
            set_cell_text_preserve_style(totals_table.cell(0, 0), "TOTAL AMOUNT")
            set_cell_text_preserve_style(totals_table.cell(0, 1), f"₹ {money(subtotal)}")
            set_cell_text_preserve_style(totals_table.cell(1, 0), f"TAXES / GST ({gst_percent.normalize()}%)")
            set_cell_text_preserve_style(totals_table.cell(1, 1), f"₹ {money(gst_amount)}")
            set_cell_text_preserve_style(totals_table.cell(2, 0), "GRAND TOTAL")
            set_cell_text_preserve_style(totals_table.cell(2, 1), f"₹ {money(grand_total)}")

            replace_amount_words(doc, amount_in_words(grand_total))
        else:
            doc = create_dynamic_document(data, doc_type=doc_type)
    else:
        doc = create_dynamic_document(data, doc_type=doc_type)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(output_path))
    print(f"Document successfully written to: {output_path.resolve()}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate GKA Construction styled DOCX quotation or invoice.")
    parser.add_argument("--data", help="Path to document data JSON file or direct JSON string.")
    parser.add_argument("--json-data", help="Direct JSON payload string.")
    parser.add_argument("--type", default="quotation", choices=["quotation", "invoice"], help="Type of document to generate.")
    parser.add_argument("--template", default=None, help="Path to DOCX template.")
    parser.add_argument("--output", default=None, help="Path to save the generated DOCX file.")
    args = parser.parse_args()

    raw_json = None
    if args.json_data:
        raw_json = args.json_data
    elif args.data:
        p = Path(args.data).expanduser()
        if p.exists() and p.is_file():
            raw_json = p.read_text(encoding="utf-8")
        else:
            raw_json = args.data

    if not raw_json:
        # Read from stdin if piped
        if not sys.stdin.isatty():
            raw_json = sys.stdin.read()
        else:
            print("Error: No data provided via --data, --json-data, or stdin.", file=sys.stderr)
            return 2

    try:
        data = json.loads(raw_json)
    except json.JSONDecodeError as exc:
        print(f"Invalid JSON: {exc}", file=sys.stderr)
        return 2

    script_dir = Path(__file__).resolve().parent
    template_path = Path(args.template).expanduser().resolve() if args.template else script_dir / DEFAULT_TEMPLATE

    doc_num = data.get("quotation_number") or data.get("invoice_number") or "DOC"
    default_filename = f"GKA_{args.type.capitalize()}_{doc_num}.docx".replace("/", "-").replace("\\", "-")
    output_path = Path(args.output).expanduser().resolve() if args.output else script_dir / default_filename

    try:
        generate_document(data, template_path, output_path, doc_type=args.type)
    except Exception as exc:
        print(f"Error during document generation: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
