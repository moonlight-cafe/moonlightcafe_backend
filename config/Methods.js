import CryptoJS from "crypto-js"
import crypto from 'crypto'
import ObjectId from 'mongoose'
import { promisify } from 'util'
import { Config, MainDB, cloudinary } from "./Init.js"
import _CustomerDetails from "../model/CustomerDetails/CustomerDetails.js"
import path from 'path'
import fs from 'fs'
import axios from "axios";
import PDFDocument from 'pdfkit';
import streamifier from 'streamifier';

const Objectid = ObjectId.Types.ObjectId
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

class Methods {
        encryptData(data) {
                try {
                        const uid = this.generateRandomString(16);
                        const secretKey = CryptoJS.enc.Utf8.parse(process.env.ENCRYPTION_KEY);
                        const iv = CryptoJS.enc.Utf8.parse(uid);
                        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey, {
                                iv: iv,
                        });
                        return encrypted.toString() + "." + uid;
                } catch (e) {
                        console.log(e);
                        return data;
                }
        }

        decryptData(data, tempkey) {
                try {
                        const secretKey = CryptoJS.enc.Utf8.parse(process.env.ENCRYPTION_KEY);
                        let iv = CryptoJS.enc.Utf8.parse(tempkey);
                        const bytes = CryptoJS.AES.decrypt(data, secretKey, { iv: iv });
                        const deData = bytes.toString(CryptoJS.enc.Utf8);
                        return JSON.parse(deData);
                } catch (e) {
                        console.log(e);
                }
        }

        encryptPassword(text, key) {
                const hashKey = crypto.createHash('sha256').update(key).digest();
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv('aes-256-cbc', hashKey, iv);
                let encrypted = cipher.update(text, 'utf-8', 'hex');
                encrypted += cipher.final('hex');
                return iv.toString('hex') + ':' + encrypted;
        }

        decryptPassword(encryptedText, key) {
                const hashKey = crypto.createHash('sha256').update(key).digest();
                const [ivHex, data] = encryptedText.split(':');
                const iv = Buffer.from(ivHex, 'hex');
                const decipher = crypto.createDecipheriv('aes-256-cbc', hashKey, iv);
                let decrypted = decipher.update(data, 'hex', 'utf-8');
                decrypted += decipher.final('utf-8');
                return decrypted;
        }

        ValidateObjectId(id) {
                // Validator function
                if (Objectid.isValid(id)) {
                        if ((String)(new Objectid(id)) === id)
                                return true
                        return false
                }

                return false
        }

        checkForNullValues(key) {
                if (key !== null && key !== undefined && key !== "" && key !== "null" && key !== "undefined") {
                        return false;
                } else {
                        return true;
                }
        }

        async getFileContent(filepath, type) {
                const __dirname = path.resolve()
                filepath = __dirname + filepath
                const readFile = promisify(fs.readFile);
                let data = await readFile(filepath, type)
                return data
        }

        validatePassword(password) {
                const minLength = 8;
                const maxLength = 16;
                if (
                        password.length < minLength ||
                        password.length > maxLength ||
                        password.search(/[a-z]/i) < 0 ||
                        password.search(/[A-Z]/) < 0 ||
                        password.search(/[0-9]/) < 0
                ) {
                        return {
                                status: 400,
                                message: "Please Enter a valid password with at least 1 lowercase letter, 1 uppercase letter, and 1 number, between 8 to 16 characters.",
                        };
                } else {
                        const checkPwdtype = this.checkPWD(password);

                        if (checkPwdtype.valid === true) {
                                return {
                                        status: 200,
                                        message: "password verify"
                                };
                        } else {
                                return {
                                        status: 400,
                                        message: checkPwdtype.message,
                                };
                        }
                }
        }

        checkPWD(password) {
                for (let i = 0; i < password.length - 2; i++) {
                        const char1 = password[i].toLowerCase();
                        const char2 = password[i + 1].toLowerCase();
                        const char3 = password[i + 2].toLowerCase();

                        if (isLetter(char1) && isLetter(char2) && isLetter(char3)) {
                                if (
                                        Math.abs(char1.charCodeAt(0) - char2.charCodeAt(0)) === 1 &&
                                        Math.abs(char2.charCodeAt(0) - char3.charCodeAt(0)) === 1
                                ) {
                                        return {
                                                valid: false,
                                                message:
                                                        "Password should not contain consecutive letters (e.g., ABC, XYZ).",
                                        };
                                }
                        }

                        if (isDigit(char1) && isDigit(char2) && isDigit(char3)) {
                                if (
                                        Math.abs(char1.charCodeAt(0) - char2.charCodeAt(0)) === 1 &&
                                        Math.abs(char2.charCodeAt(0) - char3.charCodeAt(0)) === 1
                                ) {
                                        return {
                                                valid: false,
                                                message:
                                                        "Password should not contain consecutive digits (e.g., 123, 789).",
                                        };
                                }
                        }
                }

                function isLetter(char) {
                        return /[a-zA-Z]/.test(char);
                }

                function isDigit(char) {
                        return /[0-9]/.test(char);
                }
                return { valid: true, message: "Password is valid." };
        }

        validateEmailAndPhone(email, phone) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const phoneRegex = /^\d{10}$/;

                if (!emailRegex.test(email)) {
                        console.log("Invalid email.");
                        return { status: 400, message: "Invalid email." };
                }

                if (!phoneRegex.test(phone)) {
                        console.log("Invalid phone number.");
                        return { status: 400, message: "Invalid phone number." };
                }

                return { status: 200, message: "Valid input." };
        }

        getfoldername(name = "") {
                if (name == "") {
                        return "";
                }
                return name
        }

        async fileupload(fileInput, folder = "tempfolder", filename = null, extension = "pdf") {
                try {
                        const foldername = this.getfoldername(folder);
                        const baseName = filename
                                ? filename.replace(/\.[^/.]+$/, "")
                                : this.GetTimestamp().toString();

                        const publicId = `${baseName}.${extension}`;

                        // const base64Data = fileInput.replace(/^data:application\/pdf;base64,/, "");
                        const base64Data = fileInput.replace(/^data:image\/\w+;base64,/, "");
                        const buffer = Buffer.from(base64Data, "base64");

                        // Wrap the upload_stream in a Promise
                        const result = await new Promise((resolve, reject) => {
                                const uploadStream = cloudinary.uploader.upload_stream(
                                        {
                                                folder: foldername,
                                                resource_type: "auto",
                                                public_id: publicId,
                                                use_filename: true,
                                                unique_filename: false,
                                                overwrite: true,
                                                access_mode: "public"
                                        },
                                        (error, result) => {
                                                if (error) return reject(error);
                                                resolve(result);
                                        }
                                );
                                streamifier.createReadStream(buffer).pipe(uploadStream);
                        });

                        return {
                                status: 200,
                                message: "File Uploaded",
                                public_id: result.public_id,
                                format: result.format || extension,
                                display_name: result.original_filename,
                                url: result.secure_url
                        };

                } catch (err) {
                        console.error("Upload Error:", err.error?.message || err.message, err);
                        return {
                                status: 500,
                                message: "Upload failed",
                                error: err.error?.message || err.message
                        };
                }
        }

        /* ================== GENERATE + UPLOAD BILL PDF ================== */
        async GenerateBillPDF(orderData) {
                try {
                        return await new Promise((resolve, reject) => {
                                const doc = new PDFDocument({
                                        size: 'A4',
                                        margins: { top: 40, bottom: 40, left: 50, right: 50 },
                                        bufferPages: true
                                });

                                const buffers = [];
                                doc.on('data', buffers.push.bind(buffers));
                                doc.on('end', async () => {
                                        try {
                                                const pdfBuffer = Buffer.concat(buffers);
                                                const uploadResult = await new Promise((res, rej) => {
                                                        cloudinary.uploader.upload_stream(
                                                                {
                                                                        folder: "bills",
                                                                        resource_type: "raw",
                                                                        public_id: orderData.ordno,
                                                                        format: "pdf",
                                                                        use_filename: true,
                                                                        unique_filename: false,
                                                                        overwrite: true,
                                                                        access_mode: "public"
                                                                },
                                                                (error, result) => {
                                                                        if (error) rej(error);
                                                                        else res(result);
                                                                }
                                                        ).end(pdfBuffer);
                                                });
                                                resolve(uploadResult.secure_url);
                                        } catch (err) {
                                                reject(err);
                                        }
                                });

                                // ── Colors ──────────────────────────────────────────────────
                                const BG_PAGE = '#1e1e1e';
                                const BG_CARD = '#2a2a2a';
                                const BG_INNER = '#1f1f1f';
                                const BG_HEADER = '#111111';
                                const ACCENT = '#47d9a8';
                                const TEXT_LIGHT = '#cccccc';
                                const TEXT_WHITE = '#ffffff';
                                const LINE_COL = '#333333';
                                const RADIUS = 10;

                                const PAGE_W = doc.page.width;
                                const CARD_X = 50;
                                const CARD_W = PAGE_W - 100;   // left+right margin = 100
                                const COL_R_W = 160;            // right-column width for values
                                const CARD_PAD = 14;             // inner horizontal padding inside each card

                                // ── Helpers ──────────────────────────────────────────────────

                                /** Full-page dark background */
                                const drawPageBg = () => {
                                        doc.rect(0, 0, PAGE_W, doc.page.height).fill(BG_PAGE);
                                };

                                /**
                                 * Draw a rounded card outline (border only, transparent fill
                                 * so inner rows are visible on top).
                                 * Returns the y after the card border is stroked.
                                 */
                                const strokeCard = (x, y, w, h, color = ACCENT) => {
                                        doc.roundedRect(x, y, w, h, RADIUS)
                                                .lineWidth(1)
                                                .stroke(color);
                                };

                                /**
                                 * Draw a filled rounded rect (used for background fill of a card).
                                 */
                                const fillCard = (x, y, w, h, fillColor) => {
                                        doc.roundedRect(x, y, w, h, RADIUS)
                                                .fill(fillColor);
                                };

                                /**
                                 * Section header row (accent background, dark text, full-width
                                 * inside the card).  Top corners rounded only.
                                 */
                                const drawSectionHeader = (title, x, y, w) => {
                                        // Rounded top, square bottom → draw as rect + manual top arc
                                        // Easiest: draw full rounded rect, then cover bottom half corners
                                        doc.roundedRect(x, y, w, 30, RADIUS).fill(BG_HEADER);
                                        // Bottom cover to make bottom corners square-ish
                                        doc.rect(x, y + 15, w, 15).fill(BG_HEADER);
                                        // Title text
                                        doc.fillColor(ACCENT)
                                                .fontSize(12)
                                                .font('Helvetica-Bold')
                                                .text(title, x, y + 10, { align: 'center', width: w });
                                        // Bottom border line
                                        doc.moveTo(x, y + 30)
                                                .lineTo(x + w, y + 30)
                                                .lineWidth(1)
                                                .stroke(LINE_COL);
                                        return y + 30;
                                };

                                /**
                                 * Draw a single label-value row inside a card.
                                 * Returns updated y after the row.
                                 */
                                const drawRow = (label, value, x, y, w, opts = {}) => {
                                        const rowH = opts.rowH || 32;          // taller rows = more vertical padding
                                        const labelColor = opts.labelColor || TEXT_LIGHT;
                                        const valueColor = opts.valueColor || TEXT_LIGHT;
                                        const fontSize = opts.fontSize || 11;
                                        const bold = opts.bold || false;

                                        // Row background
                                        doc.rect(x, y, w, rowH).fill(BG_INNER);

                                        const textY = y + (rowH - fontSize) / 2 + 1;

                                        // Label — respects left padding
                                        doc.fillColor(labelColor)
                                                .fontSize(fontSize)
                                                .font(bold ? 'Helvetica-Bold' : 'Helvetica')
                                                .text(label, x + CARD_PAD, textY, {
                                                        width: w - COL_R_W - CARD_PAD * 2,
                                                        lineBreak: false
                                                });

                                        // Value — respects right padding
                                        doc.fillColor(valueColor)
                                                .fontSize(fontSize)
                                                .font(bold ? 'Helvetica-Bold' : 'Helvetica')
                                                .text(String(value).replace(/₹/g, 'Rs. '),
                                                        x + w - COL_R_W - CARD_PAD,
                                                        textY,
                                                        { width: COL_R_W, align: 'right', lineBreak: false });

                                        return y + rowH;
                                };

                                /**
                                 * Draw a horizontal separator line.
                                 */
                                const drawLine = (x, y, w) => {
                                        doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.5).stroke(LINE_COL);
                                };

                                // ── Start drawing ────────────────────────────────────────────
                                drawPageBg();

                                // ─── Outer card background ───────────────────────────────────
                                // We'll accumulate sections and know total height at the end,
                                // so draw outer card bg first at full page minus margins.
                                // (card height is computed section by section)

                                let y = 40;

                                // ─── HEADER (logo area) ──────────────────────────────────────
                                const headerH = 70;
                                fillCard(CARD_X, y, CARD_W, headerH, BG_HEADER);
                                // Bottom border of header
                                doc.moveTo(CARD_X, y + headerH).lineTo(CARD_X + CARD_W, y + headerH)
                                        .lineWidth(2).stroke(ACCENT);

                                // Cafe name as logo text (image loading is async — use text fallback)
                                doc.fillColor(ACCENT)
                                        .fontSize(22)
                                        .font('Helvetica-Bold')
                                        .text('Moonlight Cafe', CARD_X, y + 15, { align: 'center', width: CARD_W });
                                doc.fillColor(TEXT_LIGHT)
                                        .fontSize(11)
                                        .font('Helvetica')
                                        .text('~ Fine Dining Experience ~', CARD_X, y + 42, { align: 'center', width: CARD_W });
                                y += headerH + 10;

                                // ─── BILL RECEIPT TITLE ──────────────────────────────────────
                                doc.fillColor(ACCENT)
                                        .fontSize(16)
                                        .font('Helvetica-Bold')
                                        .text('Bill Receipt', CARD_X, y, { align: 'center', width: CARD_W });
                                y += 28;

                                // ─── ORDER DETAILS CARD ──────────────────────────────────────
                                const details = [
                                        { label: 'Order No', value: `#${orderData.ordno}`, accent: true },
                                        { label: 'Date', value: orderData.orddate },
                                        { label: 'Customer', value: orderData.customer },
                                        { label: 'Table No', value: orderData.tblno },
                                        { label: 'Service Type', value: orderData.service },
                                        { label: 'Payment Mode', value: orderData.paymentmode }
                                ];
                                const detailRowH = 32;
                                const detailCardH = 30 + details.length * detailRowH;   // header + rows

                                fillCard(CARD_X, y, CARD_W, detailCardH, BG_INNER);
                                let iy = drawSectionHeader('ORDER DETAILS', CARD_X, y, CARD_W);

                                details.forEach((item, idx) => {
                                        iy = drawRow(
                                                item.label,
                                                item.value,
                                                CARD_X, iy, CARD_W,
                                                {
                                                        rowH: detailRowH,
                                                        valueColor: item.accent ? ACCENT : TEXT_LIGHT,
                                                }
                                        );
                                        if (idx < details.length - 1) drawLine(CARD_X, iy, CARD_W);
                                });

                                strokeCard(CARD_X, y, CARD_W, detailCardH);
                                y += detailCardH + 15;

                                // ─── ITEMS TABLE CARD ────────────────────────────────────────
                                const items = orderData.data || [];
                                const itemRowH = 32;
                                const itemsCardH = 30 + items.length * itemRowH;

                                fillCard(CARD_X, y, CARD_W, itemsCardH, BG_INNER);

                                // Table header (accent background)
                                doc.roundedRect(CARD_X, y, CARD_W, 30, RADIUS).fill(ACCENT);
                                doc.rect(CARD_X, y + 15, CARD_W, 15).fill(ACCENT);   // square bottom of header

                                doc.fillColor('#111111').fontSize(11).font('Helvetica-Bold');
                                doc.text('Item', CARD_X + CARD_PAD, y + 10, { width: CARD_W * 0.55 - CARD_PAD, lineBreak: false });
                                doc.text('Qty', CARD_X + CARD_W * 0.55, y + 10, { width: CARD_W * 0.15, align: 'center', lineBreak: false });
                                doc.text('Price', CARD_X + CARD_W * 0.70, y + 10, { width: CARD_W * 0.28 - CARD_PAD, align: 'right', lineBreak: false });

                                let ry = y + 30;
                                items.forEach((item, idx) => {
                                        doc.rect(CARD_X, ry, CARD_W, itemRowH).fill(BG_INNER);

                                        const textY = ry + (itemRowH - 11) / 2 + 1;
                                        doc.fillColor(TEXT_LIGHT).fontSize(11).font('Helvetica')
                                                .text(item.foodname, CARD_X + CARD_PAD, textY,
                                                        { width: CARD_W * 0.55 - CARD_PAD, lineBreak: false });
                                        doc.text(String(item.quantity),
                                                CARD_X + CARD_W * 0.55, textY,
                                                { width: CARD_W * 0.15, align: 'center', lineBreak: false });
                                        doc.text(String(item.price).replace(/₹/g, 'Rs. '),
                                                CARD_X + CARD_W * 0.70, textY,
                                                { width: CARD_W * 0.28 - CARD_PAD, align: 'right', lineBreak: false });

                                        ry += itemRowH;
                                        if (idx < items.length - 1) drawLine(CARD_X, ry, CARD_W);
                                });

                                strokeCard(CARD_X, y, CARD_W, itemsCardH);
                                y += itemsCardH + 15;

                                // ─── PAYMENT SUMMARY CARD ────────────────────────────────────
                                const summaryRows = [
                                        { label: 'Subtotal', value: orderData.amount },
                                        { label: 'Tip', value: orderData.tipamount || 'Rs. 0' },
                                        { label: `Tax (${orderData.taxpercent}%)`, value: orderData.taxamount },
                                ];
                                const totalRowH = 40;
                                const summaryCardH = 30 + summaryRows.length * 32 + totalRowH;

                                fillCard(CARD_X, y, CARD_W, summaryCardH, BG_INNER);
                                let sy = drawSectionHeader('PAYMENT SUMMARY', CARD_X, y, CARD_W);

                                summaryRows.forEach((item, idx) => {
                                        sy = drawRow(item.label, item.value, CARD_X, sy, CARD_W);
                                        drawLine(CARD_X, sy, CARD_W);
                                });

                                // Total row (bigger, highlighted)
                                doc.rect(CARD_X, sy, CARD_W, totalRowH).fill(BG_INNER);
                                doc.fillColor(TEXT_WHITE).fontSize(14).font('Helvetica-Bold')
                                        .text('Total Amount', CARD_X + CARD_PAD, sy + 12,
                                                { width: CARD_W - COL_R_W - CARD_PAD * 2, lineBreak: false });
                                doc.fillColor(ACCENT).fontSize(16).font('Helvetica-Bold')
                                        .text(String(orderData.totalamount).replace(/₹/g, 'Rs. '),
                                                CARD_X + CARD_W - COL_R_W - CARD_PAD, sy + 12,
                                                { width: COL_R_W, align: 'right', lineBreak: false });

                                strokeCard(CARD_X, y, CARD_W, summaryCardH);
                                y += summaryCardH + 20;

                                // ─── FOOTER MESSAGE ──────────────────────────────────────────
                                doc.fillColor(TEXT_LIGHT).fontSize(11).font('Helvetica')
                                        .text('Thank you for dining with us!', CARD_X, y, { align: 'center', width: CARD_W });
                                y += 16;
                                doc.fillColor(TEXT_LIGHT).fontSize(11).font('Helvetica')
                                        .text('We look forward to serving you again at ', CARD_X, y,
                                                { align: 'center', width: CARD_W, continued: true });
                                doc.fillColor(ACCENT).font('Helvetica-Bold').text('Moonlight Cafe', { continued: false });
                                y += 30;

                                // ─── FOOTER BAR ──────────────────────────────────────────────
                                const footerH = 36;
                                fillCard(CARD_X, y, CARD_W, footerH, BG_HEADER);
                                doc.moveTo(CARD_X, y).lineTo(CARD_X + CARD_W, y).lineWidth(2).stroke(ACCENT);
                                doc.fillColor(ACCENT).fontSize(10).font('Helvetica')
                                        .text('© 2026 Moonlight Cafe. All rights reserved.',
                                                CARD_X, y + 12, { align: 'center', width: CARD_W });

                                // ─── Outer card border (full wrap) ───────────────────────────
                                const outerTop = 40;
                                const outerH = y + footerH - outerTop;
                                doc.roundedRect(CARD_X, outerTop, CARD_W, outerH, RADIUS)
                                        .lineWidth(1.5)
                                        .stroke(ACCENT);

                                doc.end();
                        });
                } catch (err) {
                        console.error("Bill PDF Error:", err);
                        throw err;
                }
        }

        async AxiosRequest(url, method = "GET", body = {}, headers = {}) {

                try {
                        const options = {
                                url,
                                method,
                                headers: {
                                        "Content-Type": "application/json",
                                        ...headers,
                                },
                        };

                        if (method !== "GET") {
                                options.data = body;
                        }

                        const response = await axios(options);

                        return {
                                success: true,
                                data: response.data,
                                status: response.status,
                        };
                } catch (error) {
                        console.error("AXIOS REQUEST ERROR:", error.message);

                        return {
                                success: false,
                                error: error.response?.data || error.message,
                                status: error.response?.status || 500,
                        };
                }
        }

        getObjectId() {
                return ObjectId.Types.ObjectId
        }

        getdatetimeisostr() {
                return new Date().toISOString();
        }

        getdatetimestr() {
                return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        }

        generateRandomString(length) {
                const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let result = '';
                const charactersLength = characters.length;

                for (let i = 0; i < length; i++) {
                        result += characters.charAt(Math.floor(Math.random() * charactersLength));
                }

                return result;
        }

        generateRandomPassword(length = 20) {
                // const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
                // let result = '';
                // const charactersLength = characters.length;

                // for (let i = 0; i < length; i++) {
                //         result += characters.charAt(Math.floor(Math.random() * charactersLength));
                // }

                // return result;
                if (!Number.isInteger(length) || length < 4) {
                        throw new Error('Password length must be an integer of at least 4 to include all character types.');
                }

                const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const lower = 'abcdefghijklmnopqrstuvwxyz';
                const numbers = '0123456789';
                const special = '!@#$%^&*()_+[]{}|;:,.<>?';
                const all = upper + lower + numbers + special;

                // Ensure at least one character from each group
                let result = [
                        upper.charAt(Math.floor(Math.random() * upper.length)),
                        lower.charAt(Math.floor(Math.random() * lower.length)),
                        numbers.charAt(Math.floor(Math.random() * numbers.length)),
                        special.charAt(Math.floor(Math.random() * special.length))
                ];

                // Fill the rest randomly from the combined pool
                for (let i = result.length; i < length; i++) {
                        result.push(all.charAt(Math.floor(Math.random() * all.length)));
                }

                // Shuffle the result to avoid predictable pattern
                return result
                        .sort(() => Math.random() - 0.5)
                        .join('');
        }

        generateRandomNumber(length) {
                const characters = '0123456789';
                let result = '';
                const charactersLength = characters.length;

                for (let i = 0; i < length; i++) {
                        result += characters.charAt(Math.floor(Math.random() * charactersLength));
                }

                return result;
        }

        secureHash(mainKey, unqkey, unqid, id) {
                const combined = mainKey + unqkey + unqid;
                let hash = id;
                for (let i = 0; i < combined.length; i++) {
                        hash = ((hash << 5) + hash) + combined.charCodeAt(i);
                }
                const expected = (hash >>> 0).toString(16) + unqkey.slice(0, 10);
                return expected;
        }

        getServiceType(type = 1) {
                if (type == 1) {
                        return "Dine in"
                } else if (type == 2) {
                        return "Take Away"
                } else if (type == 3) {
                        return "Reservation"
                } else {
                        return "Invalid Service"
                }
        }

        VerifyGetaccessToken(key, unqkey, unqid, id) {
                try {
                        const mainKey = Config.tokenkey;
                        const expectedKey = this.secureHash(mainKey, unqkey, unqid, id);
                        return key === expectedKey;
                } catch (error) {
                        console.error('Verification error:', error);
                        return false;
                }
        }

        async CheckEmailMobileNumberCustomerCodeForLogin(code) {

                try {
                        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(code);

                        const isNumber = /^\d{10}$/.test(code);

                        let matchField = {};
                        let message = ""
                        if (isEmail) {
                                matchField = { email: code };
                                message = "No account found with this Email."
                        } else if (isNumber) {
                                matchField = { number: code };
                                message = "No account found with this Number."
                        } else {
                                matchField = { uniqueid: code };
                                message = "No account found with this ID."
                        }

                        const userResult = await MainDB.getmenual("tblcafe_customerdetails", new _CustomerDetails(), [
                                { $match: matchField }
                        ]);

                        return { data: userResult.ResultData[0], message };
                } catch (error) {
                        console.error("Login error:", error);
                        return {
                                status: 500,
                                message: Config.resstatuscode["500"],
                                error: error.message || error
                        }
                }
        }

        async GetRandomCustomerId() {
                try {
                        let uniqueid;
                        let exists = true;

                        while (exists) {
                                uniqueid = this.generateRandomNumber(8);

                                const checkunique = await MainDB.getmenual("tblcafe_customerdetails", new _CustomerDetails(), [{ $match: { uniqueid: uniqueid } }]);


                                if (checkunique.ResultData.length === 0) {
                                        exists = false;
                                }
                        }

                        return uniqueid;
                } catch (error) {
                        console.error("Error generating unique customer ID:", error);
                        throw error;
                }
        }

        GetGlobalSearchFilter(schemaObj, searchtext, extrakeys = [], otherschema) {
                searchtext = searchtext.trim();
                let fields = extrakeys;

                // if (fieldorder) {
                //         fieldorder?.fields.forEach((element) => {
                //                 fields.push(element.field);
                //         });
                // }

                const searchFilter = [];
                for (const key in schemaObj) {
                        if (fields.includes(key) || fields.length == 0) {
                                if (schemaObj[key].type === String) {
                                        searchFilter.push({ [key]: { $regex: searchtext, $options: "i" } });
                                } else if (
                                        schemaObj[key].type === Number &&
                                        !isNaN(parseFloat(searchtext))
                                ) {
                                        searchFilter.push({ [key]: parseFloat(searchtext) });
                                } else if (Array.isArray(schemaObj[key])) {
                                        for (const arraykey in schemaObj[key][0]) {
                                                if (schemaObj[key][0][arraykey].type === String) {
                                                        searchFilter.push({
                                                                [`${key}.${arraykey}`]: { $regex: searchtext, $options: "i" },
                                                        });
                                                } else if (
                                                        schemaObj[key][0][arraykey].type === Number &&
                                                        !isNaN(parseFloat(searchtext))
                                                ) {
                                                        searchFilter.push({
                                                                [`${key}.${arraykey}`]: parseFloat(searchtext),
                                                        });
                                                }
                                        }
                                }
                        }
                }
                return [{ $match: { $or: searchFilter } }];
        }

        GetPipelineForFilter(filter, concatobj = null) {
                let pipeline = []

                const filterObj = {}

                if (Object?.keys(filter)?.length) {
                        Object.entries(filter).forEach(([key, value]) => {
                                if (value !== "") {
                                        if (typeof value === "number" || typeof value === "boolean") {
                                                filterObj[key] = value
                                        } else if (Array.isArray(value)) {
                                                if (value.length) {
                                                        if (this.ValidateObjectId(value[0])) {
                                                                filterObj[key] = { $in: value.map((data) => new Objectid(data)) }
                                                        } else {
                                                                filterObj[key] = { $in: value }
                                                        }
                                                }
                                        } else if (this.ValidateObjectId(value)) {
                                                filterObj[key] = new Objectid(value)
                                        } else {
                                                filterObj[key] = { $regex: new RegExp(".*" + value?.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*"), $options: "i" }
                                        }
                                }
                        })

                        pipeline = [{ $match: filterObj }]
                }
                if (concatobj !== null) {
                        concatobj.forEach((val) => {
                                const concatfield = { $addFields: { [val.concatname]: { $concat: ["$" + val.field1, val.symbol, "$" + val.field2] } } }
                                pipeline.push({ ...concatfield })
                        })
                }

                return pipeline

        }

        generateuuid() {
                return crypto.randomUUID()
        }

        Jsontostring(data) {
                return JSON.stringify(data)
        }

        //get timestamp string
        GetTimestamp() {
                return Date.now();
        }

        generateOrderItemsHTML(items) {
                return items.map(item => `
                        <tr>
                        <td style="padding:10px; word-break:break-word; border-bottom:1px solid #333;">
                                ${item.foodname}
                        </td>

                        <td style="padding:10px; word-break:break-word; text-align:center; border-bottom:1px solid #333;">
                                ${item.quantity}
                        </td>

                        <td style="padding:10px; word-break:break-word; text-align:right; border-bottom:1px solid #333;">
                                ₹${item.price}
                        </td>
                        </tr>
                `).join('');
        }

        formatDateToCustom(dateInput) {
                const date = new Date(dateInput);

                if (isNaN(date)) return ""; // invalid date

                // Get parts
                let year = date.getFullYear().toString().slice(-2); // last 2 digits
                let month = String(date.getMonth() + 1).padStart(2, '0'); // 0-based
                let day = String(date.getDate()).padStart(2, '0');

                let hours = date.getHours();
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');

                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12; // convert 0 to 12 for 12 AM
                hours = String(hours).padStart(2, '0');

                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${ampm}`;
        }

        GetIndianTimestamp() {
                return moment().utcOffset("+05:30").format();
        }


        toBase32(buffer) {
                let bits = 0;
                let value = 0;
                let output = "";

                for (const byte of buffer) {
                        value = (value << 8) | byte;
                        bits += 8;

                        while (bits >= 5) {
                                output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
                                bits -= 5;
                        }
                }

                if (bits > 0) {
                        output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
                }

                return output;
        }

        fromBase32(input = "") {
                const clean = input.toUpperCase().replace(/=+$/g, "").replace(/[^A-Z2-7]/g, "");
                let bits = 0;
                let value = 0;
                const bytes = [];

                for (const ch of clean) {
                        const idx = BASE32_ALPHABET.indexOf(ch);
                        if (idx < 0) continue;
                        value = (value << 5) | idx;
                        bits += 5;

                        if (bits >= 8) {
                                bytes.push((value >>> (bits - 8)) & 255);
                                bits -= 8;
                        }
                }

                return Buffer.from(bytes);
        }

        hotp(secretBase32, counter) {
                const secret = this.fromBase32(secretBase32);
                const counterBuffer = Buffer.alloc(8);
                const big = BigInt(counter);
                counterBuffer.writeBigUInt64BE(big);

                const hmac = crypto.createHmac("sha1", secret).update(counterBuffer).digest();
                const offset = hmac[hmac.length - 1] & 0x0f;
                const binary = ((hmac[offset] & 0x7f) << 24) |
                        ((hmac[offset + 1] & 0xff) << 16) |
                        ((hmac[offset + 2] & 0xff) << 8) |
                        (hmac[offset + 3] & 0xff);

                return (binary % 1000000).toString().padStart(6, "0");
        }

        generateBase32Secret(lengthBytes = 20) {
                return this.toBase32(crypto.randomBytes(lengthBytes));
        }

        generateTotp(secretBase32, timeStep = 30, timestampMs = Date.now()) {
                const counter = Math.floor(Math.floor(timestampMs / 1000) / timeStep);
                return this.hotp(secretBase32, counter);
        }

        verifyTotp(secretBase32, token, window = 1, timeStep = 30, timestampMs = Date.now()) {
                const code = String(token || "").trim();
                if (!/^\d{6}$/.test(code)) return false;

                const currentCounter = Math.floor(Math.floor(timestampMs / 1000) / timeStep);
                for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
                        const expected = this.hotp(secretBase32, currentCounter + errorWindow);
                        if (expected === code) return true;
                }
                return false;
        }

        buildOtpAuthUrl({ issuer, accountName, secret }) {
                const encIssuer = encodeURIComponent(issuer);
                const encAccount = encodeURIComponent(accountName);
                return `otpauth://totp/${encIssuer}:${encAccount}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
        }

}
export default Methods;
