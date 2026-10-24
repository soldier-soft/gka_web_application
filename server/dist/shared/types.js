"use strict";
// Shared Types for GKA Construction ERP
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatINR = exports.toRupees = exports.toPaise = void 0;
// Financial Helper Utilities
const toPaise = (rupees) => Math.round(rupees * 100);
exports.toPaise = toPaise;
const toRupees = (paise) => paise / 100;
exports.toRupees = toRupees;
const formatINR = (paise) => {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(rupees);
};
exports.formatINR = formatINR;
