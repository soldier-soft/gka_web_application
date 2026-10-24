"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCXService = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const constants_1 = require("../shared/constants");
class DOCXService {
    static scriptPath = path_1.default.resolve(__dirname, '../scripts/gka_document_generator.py');
    /**
     * Generate Quotation DOCX using the python generator script
     */
    static async generateQuotationDocx(quotation) {
        const tempDir = os_1.default.tmpdir();
        const tempJsonPath = path_1.default.join(tempDir, `gka_quo_${quotation._id}_${Date.now()}.json`);
        const tempDocxPath = path_1.default.join(tempDir, `GKA_Quotation_${quotation.quotationNumber}.docx`);
        const clientContact = quotation.clientContactPerson || 'THE CHIEF ENGINEER';
        const clientCompany = quotation.clientCompany || quotation.clientName || 'VIVANTHA HOTEL';
        const clientAddr = quotation.clientAddress || quotation.siteLocation || 'SHOLINGANALUR, CHENNAI.';
        const payload = {
            quotation_number: quotation.quotationNumber,
            date: new Date(quotation.createdAt || Date.now()).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }),
            subject: quotation.subject || `Quotation for Construction Works - ${quotation.projectTitle}`,
            client: {
                contact: clientContact,
                company: clientCompany,
                address_line1: clientAddr.split(',')[0] || clientAddr,
                address_line2: clientAddr.split(',').slice(1).join(',').trim() || '',
            },
            sender: {
                name: quotation.senderName || 'HARI A',
                company: quotation.senderCompany || 'GKA CONSTRUCTION',
            },
            items: quotation.items.map((it) => ({
                description: it.description,
                qty: it.quantity,
                unit: (it.unit || 'CFT').toUpperCase(),
                rate: (0, constants_1.toRupees)(it.unitRatePaise),
                amount: (0, constants_1.toRupees)(it.amountPaise),
            })),
            gst_percent: quotation.taxRatePercent || 18,
        };
        fs_1.default.writeFileSync(tempJsonPath, JSON.stringify(payload, null, 2), 'utf-8');
        return new Promise((resolve, reject) => {
            (0, child_process_1.execFile)('python', [DOCXService.scriptPath, '--data', tempJsonPath, '--type', 'quotation', '--output', tempDocxPath], (error, stdout, stderr) => {
                // Clean up temp JSON
                try {
                    if (fs_1.default.existsSync(tempJsonPath))
                        fs_1.default.unlinkSync(tempJsonPath);
                }
                catch (_) { }
                if (error) {
                    console.error('Python DOCX Error:', stderr || error.message);
                    reject(new Error(`Failed to generate DOCX quotation: ${stderr || error.message}`));
                }
                else {
                    resolve(tempDocxPath);
                }
            });
        });
    }
    /**
     * Generate Invoice / Bill DOCX using the python generator script
     */
    static async generateInvoiceDocx(invoice) {
        const tempDir = os_1.default.tmpdir();
        const tempJsonPath = path_1.default.join(tempDir, `gka_inv_${invoice._id}_${Date.now()}.json`);
        const tempDocxPath = path_1.default.join(tempDir, `GKA_Invoice_${invoice.invoiceNumber}.docx`);
        const clientContact = invoice.clientContactPerson || 'THE CHIEF ENGINEER';
        const clientCompany = invoice.clientCompany || invoice.clientName || 'VIVANTHA HOTEL';
        const clientAddr = invoice.billingAddress || 'SHOLINGANALUR, CHENNAI.';
        const payload = {
            invoice_number: invoice.invoiceNumber,
            date: new Date(invoice.issueDate || Date.now()).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }),
            subject: invoice.subject || `Tax Invoice for Construction Works - ${invoice.projectTitle}`,
            client: {
                contact: clientContact,
                company: clientCompany,
                address_line1: clientAddr.split(',')[0] || clientAddr,
                address_line2: clientAddr.split(',').slice(1).join(',').trim() || '',
            },
            sender: {
                name: invoice.senderName || 'HARI A',
                company: invoice.senderCompany || 'GKA CONSTRUCTION',
            },
            items: invoice.items.map((it) => ({
                description: it.description,
                qty: it.quantity,
                unit: (it.unit || 'CFT').toUpperCase(),
                rate: (0, constants_1.toRupees)(it.unitPricePaise),
                amount: (0, constants_1.toRupees)(it.totalPaise),
            })),
            gst_percent: 18,
        };
        fs_1.default.writeFileSync(tempJsonPath, JSON.stringify(payload, null, 2), 'utf-8');
        return new Promise((resolve, reject) => {
            (0, child_process_1.execFile)('python', [DOCXService.scriptPath, '--data', tempJsonPath, '--type', 'invoice', '--output', tempDocxPath], (error, stdout, stderr) => {
                // Clean up temp JSON
                try {
                    if (fs_1.default.existsSync(tempJsonPath))
                        fs_1.default.unlinkSync(tempJsonPath);
                }
                catch (_) { }
                if (error) {
                    console.error('Python DOCX Error:', stderr || error.message);
                    reject(new Error(`Failed to generate DOCX invoice: ${stderr || error.message}`));
                }
                else {
                    resolve(tempDocxPath);
                }
            });
        });
    }
}
exports.DOCXService = DOCXService;
