"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
exports.numberToWordsIndian = numberToWordsIndian;
exports.amountInWords = amountInWords;
const pdfkit_1 = __importDefault(require("pdfkit"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const constants_1 = require("../shared/constants");
/**
 * Converts a non-negative integer into English words using the Indian numbering system (Lakhs & Crores).
 */
function numberToWordsIndian(num) {
    if (num === 0)
        return 'Zero';
    const ones = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function under1000(n) {
        const res = [];
        if (n >= 100) {
            res.push(ones[Math.floor(n / 100)], 'Hundred');
            n %= 100;
        }
        if (n >= 20) {
            res.push(tens[Math.floor(n / 10)]);
            n %= 10;
        }
        if (n > 0)
            res.push(ones[n]);
        return res.join(' ');
    }
    const parts = [];
    const units = [
        ['Crore', 10000000],
        ['Lakh', 100000],
        ['Thousand', 1000],
        ['', 1],
    ];
    for (const [unit, divisor] of units) {
        const chunk = Math.floor(num / divisor);
        num %= divisor;
        if (chunk > 0) {
            if (unit === '') {
                parts.push(under1000(chunk));
            }
            else {
                parts.push(`${numberToWordsIndian(chunk)} ${unit}`);
            }
        }
    }
    return parts.join(' ').trim();
}
function amountInWords(rupees, paise = 0) {
    let res = `Rupees ${numberToWordsIndian(Math.floor(rupees))}`;
    if (paise > 0) {
        res += ` and ${numberToWordsIndian(paise)} Paise`;
    }
    return res + ' Only.';
}
class PDFService {
    /**
     * Helper to resolve static image assets across public, dist, and server asset directories
     */
    static resolveAssetPath(filename) {
        const candidates = [
            path_1.default.resolve(process.cwd(), 'client/public', filename),
            path_1.default.resolve(process.cwd(), 'public', filename),
            path_1.default.resolve(process.cwd(), 'dist', filename),
            path_1.default.resolve(process.cwd(), 'assets', filename),
            path_1.default.resolve(__dirname, '../assets', filename),
            path_1.default.resolve(__dirname, '../../src/assets', filename),
            path_1.default.resolve(process.cwd(), 'server/src/assets', filename),
            path_1.default.resolve(process.cwd(), 'server/dist/assets', filename),
            path_1.default.resolve(__dirname, '../../../client/public', filename),
        ];
        for (const p of candidates) {
            if (fs_1.default.existsSync(p))
                return p;
        }
        return '';
    }
    /**
     * Draw the authentic GKA Construction Header with brand colors, pillars, registered office and tax details.
     */
    static drawBrandedHeader(doc, title, docNumber, docDate) {
        // Decorative Geometric Corner Accents in Top-Right
        doc.save();
        doc.polygon([535, 0], [595, 0], [595, 60]).fill('#0F254B');
        doc.polygon([560, 0], [595, 0], [595, 45]).fill('#D6A21D');
        doc.restore();
        // Brand Logo & Title on Left (Use authentic cropped brand header image if available)
        const headerImgPath = this.resolveAssetPath('gka_header_full.png');
        if (headerImgPath) {
            doc.image(headerImgPath, 38, 16, { width: 205 });
        }
        else {
            doc.fillColor('#0F254B').fontSize(20).font('Helvetica-Bold').text(constants_1.GKA_COMPANY.name, 40, 20);
            doc.fillColor('#D6A21D').fontSize(8).font('Helvetica-Bold').text(constants_1.GKA_COMPANY.tagline, 40, 44);
            doc.fontSize(6).font('Helvetica-Bold').fillColor('#475569').text('BUILDING CONSTRUCTION | RENOVATION | CONTRACTS | ALLIED WORKS', 40, 58);
        }
        // Registered Office and GST Details strictly positioned on Right (x=260..535, align right)
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#0F254B');
        doc.text('Registered Office:', 260, 18, { width: 275, align: 'right' });
        doc.fontSize(6.8).font('Helvetica').fillColor('#475569');
        doc.text('No. 965, Pillaiyar Kovil St, Theppanandhal, Kelur,', 260, 29, { width: 275, align: 'right' });
        doc.text('Tiruvannamalai District, Tamil Nadu - 606907', 260, 38, { width: 275, align: 'right' });
        doc.fontSize(6.8).font('Helvetica-Bold').fillColor('#0F254B');
        doc.text('GSTIN : 33CDYPA3555M2ZZ  |  PAN NO : CDYPA3555M', 260, 50, { width: 275, align: 'right' });
        doc.text(`Mobile : ${constants_1.GKA_COMPANY.phoneDisplay}  |  Email : ${constants_1.GKA_COMPANY.email}`, 260, 60, { width: 275, align: 'right' });
        doc.text(`Website : ${constants_1.GKA_COMPANY.website}`, 260, 70, { width: 275, align: 'right' });
        // Document Title Banner Ribbon
        const ribbonY = 104;
        doc.save();
        // Gold Angled Side Flaps
        doc.polygon([115, ribbonY], [140, ribbonY], [125, ribbonY + 26], [100, ribbonY + 26]).fill('#D6A21D');
        doc.polygon([455, ribbonY], [480, ribbonY], [495, ribbonY + 26], [470, ribbonY + 26]).fill('#D6A21D');
        // Main Navy Center Banner
        doc.polygon([135, ribbonY], [460, ribbonY], [450, ribbonY + 26], [125, ribbonY + 26]).fill('#0F254B');
        doc.restore();
        doc.fillColor('#FFFFFF').fontSize(13).font('Helvetica-Bold').text(title, 0, ribbonY + 6, {
            width: 595,
            align: 'center',
        });
        // Quotation / Invoice No. & Date Row
        const metaY = 138;
        const numLabel = title.includes('QUOTATION') ? 'QUOTATION NO.' : 'INVOICE NO.';
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748B').text(numLabel, 40, metaY);
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#0F254B').text(docNumber, 40, metaY + 9);
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748B').text('DATE', 420, metaY, { width: 135, align: 'right' });
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#0F254B').text(new Date(docDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), 420, metaY + 9, { width: 135, align: 'right' });
        return metaY + 26;
    }
    /**
     * Draw Two-Column TO / FROM Box and Subject Bar
     */
    static drawClientSenderAndSubject(doc, startY, client, sender, subject) {
        const boxY = startY;
        const boxHeight = 64;
        const boxWidth = 515;
        // Draw light-blue bordered box
        doc.rect(40, boxY, boxWidth, boxHeight).fill('#F8FAFC').stroke('#B8D5E5').lineWidth(1).stroke();
        // Vertical Divider
        doc.moveTo(310, boxY).lineTo(310, boxY + boxHeight).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
        // TO Column (Left)
        doc.circle(48, boxY + 12, 3.5).fill('#D6A21D');
        doc.fillColor('#D6A21D').fontSize(8).font('Helvetica-Bold').text('TO:', 56, boxY + 8);
        doc.fillColor('#0F254B').fontSize(8.5).font('Helvetica-Bold');
        doc.text(client.contactPerson || client.name.toUpperCase(), 48, boxY + 20, { width: 250 });
        doc.fontSize(7.5).font('Helvetica');
        if (client.company) {
            doc.text(client.company.toUpperCase(), 48, boxY + 31, { width: 250 });
        }
        const cleanAddr = (client.address || 'Chennai, Tamil Nadu').replace(/\n/g, ', ');
        doc.text(cleanAddr, 48, boxY + (client.company ? 42 : 31), { width: 250 });
        // FROM Column (Right)
        doc.circle(320, boxY + 12, 3.5).fill('#D6A21D');
        doc.fillColor('#D6A21D').fontSize(8).font('Helvetica-Bold').text('FROM:', 328, boxY + 8);
        doc.fillColor('#0F254B').fontSize(8.5).font('Helvetica-Bold');
        doc.text(sender.name || 'HARI A', 320, boxY + 20, { width: 225 });
        doc.fontSize(7.5).font('Helvetica');
        doc.text(sender.company || 'GKA CONSTRUCTION', 320, boxY + 31, { width: 225 });
        // SUBJECT Row (Distinct X coordinates to guarantee ZERO text overlay!)
        const subjY = boxY + boxHeight + 8;
        doc.rect(40, subjY - 1, 10, 10).fill('#0F254B');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#D6A21D').text('SUBJECT:', 56, subjY, { width: 55 });
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#0F254B').text(subject, 115, subjY, { width: 440 });
        return subjY + 18;
    }
    /**
     * Draw Bank Details, Terms & Conditions, Proprietor Signature & Seal, and Footer
     */
    static drawBottomAndFooter(doc, startY, notes, isInvoice = false, customTerms) {
        const bottomY = Math.max(startY + 8, 565);
        // Left Card: BANK DETAILS (Light Blue border, Deep Navy Header)
        doc.rect(40, bottomY, 255, 124).fill('#F8FAFC').stroke('#B8D5E5').lineWidth(1).stroke();
        doc.rect(40, bottomY, 255, 18).fill('#0F254B');
        doc.circle(48, bottomY + 9, 2.5).fill('#D6A21D');
        doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold').text('BANK DETAILS', 56, bottomY + 5);
        const bankDetailsList = [
            ['BENEFICIARY NAME', `:  ${constants_1.GKA_COMPANY.bankDetails.beneficiary}`],
            ['ACCOUNT NUMBER', `:  ${constants_1.GKA_COMPANY.bankDetails.accountNumber}`],
            ['BANK NAME', `:  ${constants_1.GKA_COMPANY.bankDetails.bankName.toUpperCase()}`],
            ['IFSC CODE', `:  ${constants_1.GKA_COMPANY.bankDetails.ifscCode}`],
            ['MICR CODE', `:  ${constants_1.GKA_COMPANY.bankDetails.micr}`],
            ['MOBILE NUMBER', `:  ${constants_1.GKA_COMPANY.bankDetails.contactMobile}`],
            ['ALTERNATE NUMBER', ':  8940455917'],
            ['MAIL ID', `:  ${constants_1.GKA_COMPANY.email.toUpperCase()}`],
            ['WEBSITE', `:  ${constants_1.GKA_COMPANY.website.toUpperCase()}`],
        ];
        let bY = bottomY + 23;
        bankDetailsList.forEach(([lbl, val]) => {
            doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#475569').text(lbl, 46, bY, { width: 92 });
            doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#0F254B').text(val, 138, bY, { width: 152 });
            bY += 10.5;
        });
        // Right Card: TERMS & CONDITIONS + SIGNATURE & SEAL (Gold Accent Border)
        doc.rect(305, bottomY, 250, 124).fill('#FFFFFF').stroke('#D6A21D').lineWidth(1).stroke();
        doc.rect(314, bottomY + 6, 7, 7).fill('#0F254B');
        doc.fillColor('#0F254B').fontSize(7.5).font('Helvetica-Bold').text('TERMS & CONDITIONS:', 326, bottomY + 6);
        let terms = [];
        if (customTerms && Array.isArray(customTerms) && customTerms.length > 0) {
            terms = customTerms.map((t) => (t.startsWith('•') ? t : `• ${t}`));
        }
        else if (isInvoice) {
            terms = [
                '• Payment is due within 14 calendar days from date of invoice.',
                '• Please quote Invoice Number when executing bank transfer.',
                '• Statutory GST (18%) charged as per GSTIN compliance rules.',
                '• Overdue payments subject to 18% p.a. interest.',
                '• All billing disputes subject to Chennai jurisdiction only.',
            ];
        }
        else {
            terms = [
                '• This quotation is valid for 15 days from the date of issue.',
                '• Payment terms will be mutually agreed.',
                '• GST applicable as per government norms.',
                '• Work executed as per agreed specifications and site conditions.',
            ];
        }
        if (notes && !terms.some((t) => t.toLowerCase().includes(notes.toLowerCase()))) {
            terms.push(`• Notes / Special Terms: ${notes}`);
        }
        let tY = bottomY + 16;
        const maxTerms = 6;
        const itemsToDisplay = terms.slice(0, maxTerms);
        const lineGap = itemsToDisplay.length > 5 ? 5.8 : 7.0;
        const fontSize = itemsToDisplay.length > 5 ? 5.5 : 6.2;
        doc.font('Helvetica').fontSize(fontSize).fillColor('#475569');
        itemsToDisplay.forEach((t) => {
            doc.text(t, 314, tY, { width: 236 });
            tY += lineGap;
        });
        // Signature and Seal Images (Company on top, signature below, proprietor, seal beside)
        const sigImgPath = this.resolveAssetPath('signature.png');
        const sealImgPath = this.resolveAssetPath('seal.png');
        // Left Column: Authorized Signatory Block
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F254B').text('For GKA CONSTRUCTION', 314, bottomY + 52);
        if (sigImgPath) {
            doc.image(sigImgPath, 314, bottomY + 62, { width: 58 });
        }
        else {
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F254B').text('Hari A', 314, bottomY + 66);
        }
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F254B').text('Hari A', 314, bottomY + 95);
        doc.font('Helvetica').fontSize(6.5).fillColor('#64748B').text('Proprietor / Authorized Signatory', 314, bottomY + 105);
        // Right Column: Circular Company Seal Stamp
        if (sealImgPath) {
            doc.image(sealImgPath, 452, bottomY + 50, { width: 62 });
            doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#64748B').text('(Company Seal)', 445, bottomY + 114, { width: 76, align: 'center' });
        }
        else {
            const sealCenterX = 482;
            const sealCenterY = bottomY + 80;
            doc.circle(sealCenterX, sealCenterY, 23).lineWidth(1.2).strokeColor('#0F254B').stroke();
            doc.circle(sealCenterX, sealCenterY, 20).lineWidth(0.6).strokeColor('#0F254B').stroke();
            doc.font('Helvetica-Bold').fontSize(5).fillColor('#0F254B');
            doc.text('GKA CONSTRUCTION', sealCenterX - 20, sealCenterY - 12, { width: 40, align: 'center' });
            doc.text('★ CHENNAI ★', sealCenterX - 20, sealCenterY - 3, { width: 40, align: 'center' });
            doc.text('(Company Seal)', sealCenterX - 20, sealCenterY + 6, { width: 40, align: 'center' });
        }
        // Bottom Footer Banner Bar with Angled Gold Flaps
        const footerY = 744;
        doc.save();
        doc.rect(0, footerY, 595, 28).fill('#0F254B');
        doc.polygon([0, footerY], [20, footerY], [0, footerY + 28]).fill('#D6A21D');
        doc.polygon([595, footerY], [575, footerY], [595, footerY + 28]).fill('#D6A21D');
        doc.restore();
        doc.fillColor('#FFFFFF').fontSize(7.2).font('Helvetica-Bold');
        doc.text(`${constants_1.GKA_COMPANY.phoneDisplay}    |    ${constants_1.GKA_COMPANY.email}    |    ${constants_1.GKA_COMPANY.website}`, 30, footerY + 9);
        doc.fillColor('#D6A21D').fontSize(7.2).font('Helvetica-Bold');
        doc.text('QUALITY CONSTRUCTION FOR A BETTER TOMORROW', 350, footerY + 9, { width: 215, align: 'right' });
    }
    /**
     * Generate Branded Quotation PDF stream matching the exact uploaded reference format.
     */
    static generateQuotationPDF(quotation) {
        const doc = new pdfkit_1.default({ margin: 40, size: 'A4' });
        // 1. Header
        const quotationTitle = quotation.isNegotiated ? 'NEGOTIATED QUOTATION' : 'QUOTATION';
        const yAfterHeader = this.drawBrandedHeader(doc, quotationTitle, quotation.quotationNumber, new Date(quotation.createdAt || Date.now()));
        // 2. Client & Subject
        const client = {
            name: quotation.clientName,
            contactPerson: quotation.clientContactPerson || 'THE CHIEF ENGINEER',
            company: quotation.clientCompany || 'VIVANTHA HOTEL',
            address: quotation.clientAddress || quotation.siteLocation || 'SHOLINGANALUR, CHENNAI.',
        };
        const sender = {
            name: quotation.senderName || 'HARI A',
            company: quotation.senderCompany || 'GKA CONSTRUCTION',
        };
        const subject = quotation.subject || `Quotation for Construction Works - ${quotation.projectTitle}`;
        let y = this.drawClientSenderAndSubject(doc, yAfterHeader, client, sender, subject);
        // 3. Items Table Header (Solid Deep Navy)
        doc.rect(40, y, 515, 20).fill('#0F254B');
        doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
        doc.text('SL. NO.', 45, y + 6, { width: 35, align: 'center' });
        doc.text('DESCRIPTION', 85, y + 6, { width: 235 });
        doc.text('QTY', 325, y + 6, { width: 40, align: 'center' });
        doc.text('UNIT', 370, y + 6, { width: 40, align: 'center' });
        doc.text('RATE (Rs.)', 415, y + 6, { width: 65, align: 'right' });
        doc.text('AMOUNT (Rs.)', 485, y + 6, { width: 65, align: 'right' });
        y += 20;
        // 4. Item Rows (Dynamic Height Calculation with Bold measurement & ample line-height)
        const tableTopY = y;
        quotation.items.forEach((item, index) => {
            doc.font('Helvetica-Bold').fontSize(7.5);
            const descHeight = doc.heightOfString(item.description, { width: 230 });
            const rowHeight = Math.max(20, descHeight + 8);
            if (y + rowHeight > 540) {
                doc.addPage();
                y = 50;
            }
            // Alternating row background for readability
            if (index % 2 === 1) {
                doc.rect(40, y, 515, rowHeight).fill('#F8FAFC');
            }
            doc.fillColor('#0F254B');
            doc.font('Helvetica').fontSize(7.5).text(`${index + 1}.`, 42, y + 4, { width: 35, align: 'center' });
            doc.font('Helvetica-Bold').fontSize(7.5).text(item.description, 82, y + 4, { width: 230 });
            doc.font('Helvetica').fontSize(7.5).text(`${item.quantity}`, 320, y + 4, { width: 40, align: 'center' });
            doc.text((item.unit || 'CFT').toUpperCase(), 365, y + 4, { width: 40, align: 'center' });
            doc.text((0, constants_1.toRupees)(item.unitRatePaise).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 410, y + 4, {
                width: 65,
                align: 'right',
            });
            doc.text((0, constants_1.toRupees)(item.amountPaise).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 480, y + 4, {
                width: 70,
                align: 'right',
            });
            // Bottom border line for each row
            doc.moveTo(40, y + rowHeight).lineTo(555, y + rowHeight).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
            y += rowHeight;
        });
        // Outer border around items table
        doc.rect(40, tableTopY - 20, 515, (y - tableTopY) + 20).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
        // 5. Totals Block (Right Aligned)
        const subtotalRupees = (0, constants_1.toRupees)(quotation.subtotalPaise);
        const discountRupees = (0, constants_1.toRupees)(quotation.negotiatedDiscountPaise || quotation.discountPaise || 0);
        const taxableSubtotal = Math.max(0, subtotalRupees - discountRupees);
        const taxRupees = (0, constants_1.toRupees)(quotation.cgstPaise + quotation.sgstPaise + quotation.igstPaise);
        const totalRupees = (0, constants_1.toRupees)(quotation.totalAmountPaise);
        y += 4;
        // Total Amount Row
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569');
        doc.text(quotation.isNegotiated ? 'GROSS ESTIMATE' : 'TOTAL AMOUNT', 330, y, { width: 130, align: 'right' });
        doc.fillColor('#0F254B').text(`Rs.  ${subtotalRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 465, y, {
            width: 85,
            align: 'right',
        });
        y += 14;
        // Negotiated Discount Row (Only when isNegotiated is enabled)
        if (quotation.isNegotiated && discountRupees > 0) {
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#059669');
            doc.text('LESS: NEGOTIATED DISCOUNT', 290, y, { width: 170, align: 'right' });
            doc.text(`- Rs.  ${discountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 465, y, {
                width: 85,
                align: 'right',
            });
            y += 14;
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569');
            doc.text('TAXABLE ESTIMATE', 330, y, { width: 130, align: 'right' });
            doc.fillColor('#0F254B').text(`Rs.  ${taxableSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 465, y, {
                width: 85,
                align: 'right',
            });
            y += 14;
        }
        // Taxes Row
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569');
        doc.text(`TAXES / GST (${quotation.taxRatePercent || 18}%)`, 330, y, { width: 130, align: 'right' });
        doc.fillColor('#0F254B').text(`Rs.  ${taxRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 465, y, {
            width: 85,
            align: 'right',
        });
        y += 16;
        // GRAND TOTAL Banner (Navy bar with Gold side accent)
        doc.save();
        doc.polygon([335, y - 2], [345, y - 2], [340, y + 18], [330, y + 18]).fill('#D6A21D');
        doc.rect(342, y - 2, 213, 20).fill('#0F254B');
        doc.restore();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
        doc.text(quotation.isNegotiated ? 'NET NEGOTIATED TOTAL' : 'GRAND TOTAL', 350, y + 3, { width: 120, align: 'left' });
        doc.text(`Rs.  ${totalRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, y + 3, {
            width: 100,
            align: 'right',
        });
        y += 26;
        // 6. AMOUNT IN WORDS Banner (Clean distinct box and coordinates)
        doc.rect(40, y, 515, 20).fill('#FFFBEB').stroke('#FDE68A').lineWidth(0.8).stroke();
        doc.rect(46, y + 5, 8, 8).fill('#D6A21D');
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#D6A21D').text('AMOUNT IN WORDS:', 58, y + 5, { width: 105 });
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F254B').text(amountInWords(totalRupees), 168, y + 5, { width: 380 });
        y += 24;
        // 7. CLIENT PORTAL WORKSPACE ACCESS CREDENTIALS
        const clientUsername = quotation.clientPortalUsername ||
            quotation.clientEmail ||
            (quotation.clientContactPerson ? `${quotation.clientContactPerson.toLowerCase().replace(/[^a-z0-9]/g, '')}@client.com` : 'client@gingerhotel.com');
        const clientPassword = quotation.clientPortalPassword || quotation.defaultPassword || 'GKAclient2026!';
        const portalUrl = 'https://www.gkaconstruction.com/login';
        doc.rect(40, y, 515, 34).fill('#EFF6FF').stroke('#93C5FD').lineWidth(0.8).stroke();
        doc.rect(40, y, 515, 13).fill('#1E40AF');
        doc.circle(47, y + 6.5, 2).fill('#93C5FD');
        doc.fillColor('#FFFFFF').fontSize(6.8).font('Helvetica-Bold').text('CLIENT PORTAL WORKSPACE ACCESS CREDENTIALS', 53, y + 3);
        // Three Columns: Portal Link | Login Username | Password
        doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#1E40AF').text('PORTAL LINK:', 48, y + 19);
        doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#0F254B').text(portalUrl, 102, y + 19);
        doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#1E40AF').text('LOGIN USERNAME:', 262, y + 19);
        doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#0F254B').text(clientUsername, 345, y + 19);
        doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#1E40AF').text('PASSWORD:', 436, y + 19);
        doc.rect(486, y + 15, 64, 15).fill('#FEF3C7').stroke('#F59E0B').lineWidth(0.6).stroke();
        doc.font('Helvetica-Bold').fontSize(7.2).fillColor('#92400E').text(clientPassword, 487, y + 18.5, { width: 62, align: 'center' });
        y += 38;
        const quotationNotes = quotation.isNegotiated && quotation.negotiatedNotes ? quotation.negotiatedNotes : quotation.notes;
        this.drawBottomAndFooter(doc, y, quotationNotes, false, quotation.termsAndConditions);
        doc.end();
        return doc;
    }
    /**
     * Generate Branded Tax Invoice PDF stream matching the exact uploaded reference format.
     */
    static generateInvoicePDF(invoice) {
        const doc = new pdfkit_1.default({ margin: 40, size: 'A4' });
        // 1. Header
        const title = invoice.isNegotiated ? 'NEGOTIATED TAX INVOICE' : 'TAX INVOICE';
        const yAfterHeader = this.drawBrandedHeader(doc, title, invoice.invoiceNumber, new Date(invoice.issueDate || Date.now()));
        // 2. Client & Subject
        const client = {
            name: invoice.clientName,
            contactPerson: invoice.clientContactPerson || 'THE CHIEF ENGINEER',
            company: invoice.clientCompany || 'VIVANTHA HOTEL',
            address: invoice.billingAddress || 'SHOLINGANALUR, CHENNAI.',
        };
        const sender = {
            name: invoice.senderName || 'HARI A',
            company: invoice.senderCompany || 'GKA CONSTRUCTION',
        };
        const subject = invoice.subject || `Tax Invoice for Construction Works - ${invoice.projectTitle}`;
        let y = this.drawClientSenderAndSubject(doc, yAfterHeader, client, sender, subject);
        // 3. Items Table Header (Solid Deep Navy)
        doc.rect(40, y, 515, 20).fill('#0F254B');
        doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
        doc.text('SL. NO.', 45, y + 6, { width: 35, align: 'center' });
        doc.text('DESCRIPTION', 85, y + 6, { width: 235 });
        doc.text('QTY', 325, y + 6, { width: 40, align: 'center' });
        doc.text('UNIT', 370, y + 6, { width: 40, align: 'center' });
        doc.text('RATE (Rs.)', 415, y + 6, { width: 65, align: 'right' });
        doc.text('AMOUNT (Rs.)', 485, y + 6, { width: 65, align: 'right' });
        y += 20;
        // 4. Item Rows (Dynamic Height Calculation with Bold measurement & ample line-height)
        const tableTopY = y;
        invoice.items.forEach((item, index) => {
            doc.font('Helvetica-Bold').fontSize(7.5);
            const descHeight = doc.heightOfString(item.description, { width: 230 });
            const rowHeight = Math.max(20, descHeight + 8);
            if (y + rowHeight > 540) {
                doc.addPage();
                y = 50;
            }
            if (index % 2 === 1) {
                doc.rect(40, y, 515, rowHeight).fill('#F8FAFC');
            }
            doc.fillColor('#0F254B');
            doc.font('Helvetica').fontSize(7.5).text(`${index + 1}.`, 42, y + 4, { width: 35, align: 'center' });
            doc.font('Helvetica-Bold').fontSize(7.5).text(item.description, 82, y + 4, { width: 230 });
            doc.font('Helvetica').fontSize(7.5).text(`${item.quantity}`, 320, y + 4, { width: 40, align: 'center' });
            doc.text((item.unit || 'CFT').toUpperCase(), 365, y + 4, { width: 40, align: 'center' });
            doc.text((0, constants_1.toRupees)(item.unitPricePaise).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 410, y + 4, {
                width: 65,
                align: 'right',
            });
            doc.text((0, constants_1.toRupees)(item.totalPaise).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 480, y + 4, {
                width: 70,
                align: 'right',
            });
            doc.moveTo(40, y + rowHeight).lineTo(555, y + rowHeight).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
            y += rowHeight;
        });
        // Outer border around items table
        doc.rect(40, tableTopY - 20, 515, (y - tableTopY) + 20).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
        // 5. Totals Block
        const subtotalRupees = (0, constants_1.toRupees)(invoice.subtotalPaise);
        const discountRupees = (0, constants_1.toRupees)(invoice.negotiatedDiscountPaise || invoice.discountPaise || 0);
        const taxableSubtotal = Math.max(0, subtotalRupees - discountRupees);
        const taxRupees = (0, constants_1.toRupees)(invoice.cgstPaise + invoice.sgstPaise + invoice.igstPaise);
        const totalRupees = (0, constants_1.toRupees)(invoice.totalAmountPaise);
        y += 4;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569');
        doc.text(invoice.isNegotiated ? 'GROSS BILL AMOUNT' : 'TOTAL AMOUNT', 330, y, { width: 130, align: 'right' });
        doc.fillColor('#0F254B').text(`Rs.  ${subtotalRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 465, y, {
            width: 85,
            align: 'right',
        });
        y += 14;
        if (invoice.isNegotiated && discountRupees > 0) {
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#059669');
            doc.text('LESS: NEGOTIATED DISCOUNT', 290, y, { width: 170, align: 'right' });
            doc.text(`- Rs.  ${discountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 465, y, {
                width: 85,
                align: 'right',
            });
            y += 14;
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569');
            doc.text('TAXABLE BILL VALUE', 330, y, { width: 130, align: 'right' });
            doc.fillColor('#0F254B').text(`Rs.  ${taxableSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 465, y, {
                width: 85,
                align: 'right',
            });
            y += 14;
        }
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569');
        doc.text('TAXES / GST (18%)', 330, y, { width: 130, align: 'right' });
        doc.fillColor('#0F254B').text(`Rs.  ${taxRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 465, y, {
            width: 85,
            align: 'right',
        });
        y += 16;
        // GRAND TOTAL Banner
        doc.save();
        doc.polygon([335, y - 2], [345, y - 2], [340, y + 18], [330, y + 18]).fill('#D6A21D');
        doc.rect(342, y - 2, 213, 20).fill('#0F254B');
        doc.restore();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
        doc.text(invoice.isNegotiated ? 'NET NEGOTIATED TOTAL' : 'GRAND TOTAL', 350, y + 3, { width: 120, align: 'left' });
        doc.text(`Rs.  ${totalRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, y + 3, {
            width: 100,
            align: 'right',
        });
        y += 26;
        // 6. AMOUNT IN WORDS
        doc.rect(40, y, 515, 20).fill('#FFFBEB').stroke('#FDE68A').lineWidth(0.8).stroke();
        doc.rect(46, y + 5, 8, 8).fill('#D6A21D');
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#D6A21D').text('AMOUNT IN WORDS:', 58, y + 5, { width: 105 });
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F254B').text(amountInWords(totalRupees), 168, y + 5, { width: 380 });
        y += 24;
        // 7. CLIENT PORTAL WORKSPACE ACCESS CREDENTIALS
        const clientUsername = invoice.clientPortalUsername ||
            invoice.clientEmail ||
            (invoice.clientContactPerson ? `${invoice.clientContactPerson.toLowerCase().replace(/[^a-z0-9]/g, '')}@client.com` : 'client@gingerhotel.com');
        const clientPassword = invoice.clientPortalPassword || invoice.defaultPassword || 'GKAclient2026!';
        const portalUrl = 'https://www.gkaconstruction.com/login';
        doc.rect(40, y, 515, 34).fill('#EFF6FF').stroke('#93C5FD').lineWidth(0.8).stroke();
        doc.rect(40, y, 515, 13).fill('#1E40AF');
        doc.circle(47, y + 6.5, 2).fill('#93C5FD');
        doc.fillColor('#FFFFFF').fontSize(6.8).font('Helvetica-Bold').text('CLIENT PORTAL WORKSPACE ACCESS CREDENTIALS', 53, y + 3);
        // Three Columns: Portal Link | Login Username | Password
        doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#1E40AF').text('PORTAL LINK:', 48, y + 19);
        doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#0F254B').text(portalUrl, 102, y + 19);
        doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#1E40AF').text('LOGIN USERNAME:', 262, y + 19);
        doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#0F254B').text(clientUsername, 345, y + 19);
        doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#1E40AF').text('PASSWORD:', 436, y + 19);
        doc.rect(486, y + 15, 64, 15).fill('#FEF3C7').stroke('#F59E0B').lineWidth(0.6).stroke();
        doc.font('Helvetica-Bold').fontSize(7.2).fillColor('#92400E').text(clientPassword, 487, y + 18.5, { width: 62, align: 'center' });
        y += 38;
        // 8. Bottom Sections and Footer
        const invoiceNotes = [
            invoice.notes,
            invoice.isNegotiated && invoice.negotiatedNotes ? `Agreed Special Settlement: ${invoice.negotiatedNotes}` : null,
        ]
            .filter(Boolean)
            .join(' | ');
        this.drawBottomAndFooter(doc, y, invoiceNotes, true, invoice.termsAndConditions);
        doc.end();
        return doc;
    }
    /**
     * Generate Branded Purchase Order PDF stream
     */
    static generatePurchaseOrderPDF(po) {
        const doc = new pdfkit_1.default({ margin: 40, size: 'A4' });
        doc.fillColor('#0F1E36').fontSize(22).font('Helvetica-Bold').text(constants_1.GKA_COMPANY.name, 40, 40);
        doc.fillColor('#C59A27').fontSize(10).font('Helvetica-Bold').text(constants_1.GKA_COMPANY.tagline, 40, 68);
        doc.rect(40, 110, 515, 26).fill('#0F1E36');
        doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text('PURCHASE ORDER', 48, 118);
        doc.rect(40, 144, 515, 50).strokeColor('#E2E8F0').lineWidth(1).stroke();
        doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold');
        doc.text(`PO Number: ${po.poNumber}`, 50, 152);
        doc.text(`Date: ${new Date(po.createdAt).toLocaleDateString('en-IN')}`, 50, 166);
        doc.text(`Supplier: ${po.supplierName}`, 300, 152);
        doc.font('Helvetica').fillColor('#475569');
        doc.text(`Project Site: ${po.projectTitle}`, 300, 166);
        let y = 210;
        doc.rect(40, y, 515, 20).fill('#F1F5F9');
        doc.fillColor('#0F1E36').fontSize(8).font('Helvetica-Bold');
        doc.text('#', 48, y + 6, { width: 20 });
        doc.text('Material / Item', 72, y + 6, { width: 250 });
        doc.text('Qty', 330, y + 6, { width: 40, align: 'right' });
        doc.text('Unit', 375, y + 6, { width: 40 });
        doc.text('Rate (₹)', 420, y + 6, { width: 55, align: 'right' });
        doc.text('Amount (₹)', 485, y + 6, { width: 60, align: 'right' });
        y += 24;
        doc.font('Helvetica').fontSize(8).fillColor('#334155');
        po.items.forEach((item, index) => {
            const desc = item.itemDescription || item.name || 'Item';
            const qty = item.quantityOrdered ?? item.quantity ?? 1;
            const rate = item.unitRatePaise ?? item.unitPricePaise ?? 0;
            doc.text(`${index + 1}`, 48, y, { width: 20 });
            doc.text(desc, 72, y, { width: 250 });
            doc.text(`${qty}`, 330, y, { width: 40, align: 'right' });
            doc.text(item.unit || 'Nos', 375, y, { width: 40 });
            doc.text(`${(0, constants_1.toRupees)(rate).toLocaleString('en-IN')}`, 420, y, { width: 55, align: 'right' });
            doc.text(`${(0, constants_1.toRupees)(item.totalPaise || (qty * rate)).toLocaleString('en-IN')}`, 485, y, { width: 60, align: 'right' });
            y += 20;
        });
        doc.moveTo(40, y).lineTo(555, y).strokeColor('#E2E8F0').lineWidth(1).stroke();
        y += 12;
        const totalPaise = po.grandTotalPaise ?? po.totalAmountPaise ?? 0;
        const totalRupees = (0, constants_1.toRupees)(totalPaise);
        doc.rect(360, y, 195, 22).fill('#0F1E36');
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#FFFFFF');
        doc.text('Total Order Value:', 370, y + 6, { width: 90, align: 'right' });
        doc.text(`₹ ${totalRupees.toLocaleString('en-IN')}`, 470, y + 6, { width: 75, align: 'right' });
        const sigY = 700;
        doc.fillColor('#1E293B').fontSize(8).font('Helvetica-Bold');
        doc.text('Vendor Acknowledgment', 60, sigY);
        doc.text('For GKA CONSTRUCTION', 400, sigY, { width: 140, align: 'center' });
        doc.end();
        return doc;
    }
    /**
     * Generate Branded Project Welcome PDF stream with client credentials notice, attached quotations, attached bills, and Federal Bank details.
     */
    static generateProjectWelcomePDF(project, client, inviteDetails, quotations = [], invoices = []) {
        const doc = new pdfkit_1.default({ margin: 40, size: 'A4' });
        // Geometric Corner Accents in Top-Right
        doc.save();
        doc.polygon([535, 0], [595, 0], [595, 60]).fill('#0F254B');
        doc.polygon([560, 0], [595, 0], [595, 45]).fill('#D6A21D');
        doc.restore();
        // Brand Logo & Pillars on Left
        const headerImgPath = path_1.default.resolve(__dirname, '../assets/gka_header_full.png');
        if (fs_1.default.existsSync(headerImgPath)) {
            doc.image(headerImgPath, 38, 16, { width: 205 });
        }
        else {
            doc.fillColor('#0F254B').fontSize(20).font('Helvetica-Bold').text(constants_1.GKA_COMPANY.name, 40, 20);
            doc.fillColor('#D6A21D').fontSize(8).font('Helvetica-Bold').text(constants_1.GKA_COMPANY.tagline, 40, 44);
            doc.fontSize(6).font('Helvetica-Bold').fillColor('#475569').text('BUILDING CONSTRUCTION | RENOVATION | CONTRACTS | ALLIED WORKS', 40, 58);
        }
        // Registered Office and GST Details strictly positioned on Right
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#0F254B');
        doc.text('Registered Office:', 260, 18, { width: 275, align: 'right' });
        doc.fontSize(6.8).font('Helvetica').fillColor('#475569');
        doc.text('No. 965, Pillaiyar Kovil St, Theppanandhal, Kelur,', 260, 29, { width: 275, align: 'right' });
        doc.text('Tiruvannamalai District, Tamil Nadu - 606907', 260, 38, { width: 275, align: 'right' });
        doc.fontSize(6.8).font('Helvetica-Bold').fillColor('#0F254B');
        doc.text('GSTIN : 33CDYPA3555M2ZZ  |  PAN NO : CDYPA3555M', 260, 50, { width: 275, align: 'right' });
        doc.text(`Mobile : ${constants_1.GKA_COMPANY.phoneDisplay}  |  Email : ${constants_1.GKA_COMPANY.email}`, 260, 60, { width: 275, align: 'right' });
        doc.text(`Website : ${constants_1.GKA_COMPANY.website}`, 260, 70, { width: 275, align: 'right' });
        // Document Title Banner Ribbon
        const ribbonY = 104;
        doc.save();
        doc.polygon([80, ribbonY], [105, ribbonY], [95, ribbonY + 26], [70, ribbonY + 26]).fill('#D6A21D');
        doc.polygon([490, ribbonY], [515, ribbonY], [525, ribbonY + 26], [500, ribbonY + 26]).fill('#D6A21D');
        doc.polygon([100, ribbonY], [495, ribbonY], [485, ribbonY + 26], [90, ribbonY + 26]).fill('#0F254B');
        doc.restore();
        doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold').text('PROJECT WORKSPACE ONBOARDING & CLIENT CREDENTIAL PACKET', 0, ribbonY + 7, {
            width: 595,
            align: 'center',
        });
        // Metadata Row
        const metaY = 138;
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748B').text('PROJECT WORKSPACE ID', 40, metaY);
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#0F254B').text(project.projectId, 40, metaY + 9);
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748B').text('PACKET ISSUE DATE', 420, metaY, { width: 135, align: 'right' });
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#0F254B').text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), 420, metaY + 9, { width: 135, align: 'right' });
        let y = 164;
        // 1. PROJECT WORKSPACE SUMMARY CARD
        doc.rect(40, y, 515, 66).fill('#F8FAFC').stroke('#CBD5E1').lineWidth(0.8).stroke();
        doc.rect(40, y, 515, 17).fill('#0F254B');
        doc.circle(48, y + 8.5, 2.5).fill('#D6A21D');
        doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold').text('PROJECT WORKSPACE SUMMARY', 56, y + 5);
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#475569').text('Project Title:', 48, y + 22);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F254B').text(project.title, 110, y + 22, { width: 185 });
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#475569').text('Site Address:', 48, y + 44);
        const siteStreet = project.siteAddress?.street || 'Kelambakkam, Chennai';
        const siteCity = project.siteAddress?.city ? `, ${project.siteAddress.city}` : '';
        doc.font('Helvetica').fontSize(7.5).fillColor('#0F254B').text(`${siteStreet}${siteCity}`, 110, y + 44, { width: 185 });
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#475569').text('Client Name:', 310, y + 22);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F254B').text(client?.name || project.clientName, 375, y + 22, { width: 170 });
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#475569').text('Contract Value:', 310, y + 44);
        const contractRupees = (0, constants_1.toRupees)(project.contractValuePaise || 0);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#D6A21D').text(`Rs.  ${contractRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 375, y + 44, { width: 170 });
        y += 74;
        // 2. CLIENT PORTAL ACCESS CREDENTIALS CARD
        const defaultPassword = inviteDetails.defaultPassword || inviteDetails.temporaryPassword || 'GKAclient2026!';
        doc.rect(40, y, 515, 76).fill('#EFF6FF').stroke('#93C5FD').lineWidth(1).stroke();
        doc.rect(40, y, 515, 17).fill('#1E40AF');
        doc.circle(48, y + 8.5, 2.5).fill('#93C5FD');
        doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold').text('CLIENT PORTAL ACCESS CREDENTIALS & DIRECT WORKSPACE LINK', 56, y + 5);
        doc.font('Helvetica').fontSize(6.8).fillColor('#1E293B').text('An authorized secure account has been provisioned for your project workspace. Log in to access live milestone tracking, daily verified site photographs, engineer reports, progressive billing ledger, and submit payment notifications.', 48, y + 22, { width: 495 });
        // Credential Box details
        doc.rect(48, y + 42, 498, 26).fill('#FFFFFF').stroke('#BFDBFE').lineWidth(0.8).stroke();
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E40AF').text('PORTAL URL:', 56, y + 46);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F254B').text(inviteDetails.portalUrl, 125, y + 46, { width: 160 });
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E40AF').text('LOGIN USERNAME:', 56, y + 56);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F254B').text(inviteDetails.username, 140, y + 56, { width: 145 });
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E40AF').text('DEFAULT PASSWORD:', 295, y + 50);
        doc.rect(395, y + 46, 140, 18).fill('#FEF3C7').stroke('#F59E0B').lineWidth(0.8).stroke();
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#92400E').text(defaultPassword, 400, y + 51, { width: 130, align: 'center' });
        y += 84;
        // 3. ATTACHED COMMERCIAL QUOTATIONS
        doc.rect(40, y, 515, 16).fill('#0F254B');
        doc.circle(48, y + 8, 2.5).fill('#D6A21D');
        doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold').text('ATTACHED PROJECT COMMERCIAL QUOTATIONS', 56, y + 4.5);
        y += 16;
        if (quotations && quotations.length > 0) {
            // Table Header
            doc.rect(40, y, 515, 16).fill('#F1F5F9');
            doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#475569');
            doc.text('QUOTATION NO.', 45, y + 5, { width: 85 });
            doc.text('ISSUE DATE', 135, y + 5, { width: 70 });
            doc.text('PROJECT SCOPE / TITLE', 210, y + 5, { width: 180 });
            doc.text('TOTAL AMOUNT (Rs.)', 395, y + 5, { width: 90, align: 'right' });
            doc.text('STATUS', 490, y + 5, { width: 60, align: 'center' });
            y += 16;
            quotations.slice(0, 3).forEach((q) => {
                doc.rect(40, y, 515, 16).fill('#FFFFFF').stroke('#E2E8F0').lineWidth(0.5).stroke();
                doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#0F254B').text(q.quotationNumber, 45, y + 4.5, { width: 85 });
                doc.font('Helvetica').fontSize(6.5).fillColor('#475569').text(new Date(q.createdAt || Date.now()).toLocaleDateString('en-IN'), 135, y + 4.5, { width: 70 });
                doc.font('Helvetica').fontSize(6.5).fillColor('#1E293B').text(q.projectTitle || project.title, 210, y + 4.5, { width: 180 });
                doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#0F254B').text((0, constants_1.toRupees)(q.totalAmountPaise).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 395, y + 4.5, { width: 90, align: 'right' });
                doc.font('Helvetica-Bold').fontSize(6.5).fillColor(q.status === 'approved' ? '#059669' : '#D6A21D').text((q.status || 'SENT').toUpperCase(), 490, y + 4.5, { width: 60, align: 'center' });
                y += 16;
            });
        }
        else {
            doc.rect(40, y, 515, 20).fill('#FFFFFF').stroke('#E2E8F0').lineWidth(0.5).stroke();
            doc.font('Helvetica').fontSize(6.8).fillColor('#64748B').text('• Formal commercial quotation prepared for this project workspace will automatically synchronize with your live client portal.', 48, y + 6);
            y += 20;
        }
        y += 8;
        // 4. ATTACHED INVOICES & PROGRESSIVE BILLS
        doc.rect(40, y, 515, 16).fill('#0F254B');
        doc.circle(48, y + 8, 2.5).fill('#D6A21D');
        doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold').text('ATTACHED TAX INVOICES & PROGRESSIVE BILLS', 56, y + 4.5);
        y += 16;
        if (invoices && invoices.length > 0) {
            // Table Header
            doc.rect(40, y, 515, 16).fill('#F1F5F9');
            doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#475569');
            doc.text('INVOICE NO.', 45, y + 5, { width: 85 });
            doc.text('ISSUE DATE', 135, y + 5, { width: 70 });
            doc.text('BILLING DESCRIPTION', 210, y + 5, { width: 180 });
            doc.text('TOTAL AMOUNT (Rs.)', 395, y + 5, { width: 90, align: 'right' });
            doc.text('STATUS', 490, y + 5, { width: 60, align: 'center' });
            y += 16;
            invoices.slice(0, 3).forEach((inv) => {
                doc.rect(40, y, 515, 16).fill('#FFFFFF').stroke('#E2E8F0').lineWidth(0.5).stroke();
                doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#0F254B').text(inv.invoiceNumber, 45, y + 4.5, { width: 85 });
                doc.font('Helvetica').fontSize(6.5).fillColor('#475569').text(new Date(inv.issueDate || Date.now()).toLocaleDateString('en-IN'), 135, y + 4.5, { width: 70 });
                doc.font('Helvetica').fontSize(6.5).fillColor('#1E293B').text(inv.projectTitle || project.title, 210, y + 4.5, { width: 180 });
                doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#0F254B').text((0, constants_1.toRupees)(inv.totalAmountPaise).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 395, y + 4.5, { width: 90, align: 'right' });
                doc.font('Helvetica-Bold').fontSize(6.5).fillColor(inv.status === 'paid' ? '#059669' : '#D97706').text((inv.status || 'PENDING').toUpperCase(), 490, y + 4.5, { width: 60, align: 'center' });
                y += 16;
            });
        }
        else {
            doc.rect(40, y, 515, 20).fill('#FFFFFF').stroke('#E2E8F0').lineWidth(0.5).stroke();
            doc.font('Helvetica').fontSize(6.8).fillColor('#64748B').text('• Progressive RA bills and milestone payment demands will be issued and attached directly to your workspace upon milestone verification.', 48, y + 6);
            y += 20;
        }
        y += 10;
        // 5. BOTTOM SECTION: BANK DETAILS (LEFT) & FORMAL SIGNATURE + SEAL (RIGHT)
        const bottomY = Math.max(y, 580);
        // Left Card: BANK DETAILS
        doc.rect(40, bottomY, 255, 124).fill('#F8FAFC').stroke('#B8D5E5').lineWidth(1).stroke();
        doc.rect(40, bottomY, 255, 18).fill('#0F254B');
        doc.circle(48, bottomY + 9, 2.5).fill('#D6A21D');
        doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold').text('OFFICIAL BANK TRANSFER DETAILS', 56, bottomY + 5);
        const bankDetailsList = [
            ['BENEFICIARY NAME', `:  ${constants_1.GKA_COMPANY.bankDetails.beneficiary}`],
            ['ACCOUNT NUMBER', `:  ${constants_1.GKA_COMPANY.bankDetails.accountNumber}`],
            ['BANK NAME', `:  ${constants_1.GKA_COMPANY.bankDetails.bankName.toUpperCase()}`],
            ['IFSC CODE', `:  ${constants_1.GKA_COMPANY.bankDetails.ifscCode}`],
            ['MICR CODE', `:  ${constants_1.GKA_COMPANY.bankDetails.micr}`],
            ['MOBILE NUMBER', `:  ${constants_1.GKA_COMPANY.bankDetails.contactMobile}`],
            ['ALTERNATE NUMBER', ':  8940455917'],
            ['MAIL ID', `:  ${constants_1.GKA_COMPANY.email.toUpperCase()}`],
            ['WEBSITE', `:  ${constants_1.GKA_COMPANY.website.toUpperCase()}`],
        ];
        let bY = bottomY + 23;
        bankDetailsList.forEach(([lbl, val]) => {
            doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#475569').text(lbl, 46, bY, { width: 92 });
            doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#0F254B').text(val, 138, bY, { width: 152 });
            bY += 10.5;
        });
        // Right Card: TERMS & CONDITIONS + SIGNATURE & SEAL
        doc.rect(305, bottomY, 250, 124).fill('#FFFFFF').stroke('#D6A21D').lineWidth(1).stroke();
        doc.rect(314, bottomY + 6, 7, 7).fill('#0F254B');
        doc.fillColor('#0F254B').fontSize(7.5).font('Helvetica-Bold').text('WORKSPACE TERMS & AUTHORIZATION:', 326, bottomY + 6);
        const terms = [
            '• Official client workspace provisioned under contract.',
            '• Use your portal credentials to track real-time site milestones.',
            '• Payment receipts issued upon NEFT/RTGS bank clearance.',
            '• Progressive RA bills verified by Chief Project Director.',
        ];
        let tY = bottomY + 17;
        doc.font('Helvetica').fontSize(6.2).fillColor('#475569');
        terms.forEach((t) => {
            doc.text(t, 314, tY, { width: 236 });
            tY += 7.8;
        });
        // Signature and Seal Images
        const sigImgPath = path_1.default.resolve(__dirname, '../assets/signature.png');
        const sealImgPath = path_1.default.resolve(__dirname, '../assets/seal.png');
        if (fs_1.default.existsSync(sigImgPath)) {
            doc.image(sigImgPath, 314, bottomY + 50, { width: 64 });
        }
        else {
            doc.font('Helvetica-Bold').fontSize(13).fillColor('#0F254B').text('Hari A', 314, bottomY + 54);
        }
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F254B').text('For GKA CONSTRUCTION', 314, bottomY + 86);
        doc.font('Helvetica').fontSize(6.5).fillColor('#64748B').text('Proprietor / Project Director', 314, bottomY + 96);
        if (fs_1.default.existsSync(sealImgPath)) {
            doc.image(sealImgPath, 462, bottomY + 48, { width: 58 });
            doc.font('Helvetica').fontSize(6).fillColor('#64748B').text('(Company Seal)', 450, bottomY + 104, { width: 82, align: 'center' });
        }
        // Bottom Footer Banner Bar
        const footerY = 744;
        doc.save();
        doc.rect(0, footerY, 595, 28).fill('#0F254B');
        doc.polygon([0, footerY], [20, footerY], [0, footerY + 28]).fill('#D6A21D');
        doc.polygon([595, footerY], [575, footerY], [595, footerY + 28]).fill('#D6A21D');
        doc.restore();
        doc.fillColor('#FFFFFF').fontSize(7.2).font('Helvetica-Bold');
        doc.text(`${constants_1.GKA_COMPANY.phoneDisplay}    |    ${constants_1.GKA_COMPANY.email}    |    ${constants_1.GKA_COMPANY.website}`, 30, footerY + 9);
        doc.fillColor('#D6A21D').fontSize(7.2).font('Helvetica-Bold');
        doc.text('QUALITY CONSTRUCTION FOR A BETTER TOMORROW', 350, footerY + 9, { width: 215, align: 'right' });
        doc.end();
        return doc;
    }
}
exports.PDFService = PDFService;
