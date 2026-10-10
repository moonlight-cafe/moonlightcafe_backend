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

        /* ================== GENERATE + UPLOAD BILL HTML ================== */
        async GenerateBillHTML(orderData) {
                try {
                        const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
                        let logoHtml = '';
                        if (fs.existsSync(logoPath)) {
                                const logoData = fs.readFileSync(logoPath).toString('base64');
                                logoHtml = `<img src="data:image/png;base64,${logoData}" alt="Moonlight Cafe Logo" class="brand-logo" />`;
                        }

                        const brandTextPath = path.join(process.cwd(), '..', 'admin_portal', 'src', 'assets', 'MoonlightCafeText.png');
                        let brandTextHtml = `<h1 class="brand-name">Moonlight Cafe</h1>`;
                        if (fs.existsSync(brandTextPath)) {
                                const brandTextData = fs.readFileSync(brandTextPath).toString('base64');
                                brandTextHtml = `<img src="data:image/png;base64,${brandTextData}" alt="Moonlight Cafe" style="max-height: 38px; margin-top: 5px;" />`;
                        }

                        const itemsHtml = (orderData.data || []).map((item, idx) => {
                                const priceNum = String(item.price).replace(/₹/g, '').replace(/Rs\./g, '').trim();
                                const rowTotal = (parseFloat(priceNum) * item.quantity).toFixed(2);
                                return `
                        <tr class="${idx % 2 === 0 ? 'even' : ''}">
                                <td style="text-align: left;">${item.foodname}</td>
                                <td class="right">₹ ${priceNum}</td>
                                <td class="center">${item.quantity}</td>
                                <td class="right">₹ ${rowTotal}</td>
                        </tr>
                        `;
                        }).join('');

                        const htmlString = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #${orderData.ordno}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --ink: #eceef1;
            --ink-soft: #93999f;
            --line: #2a2e35;
            --accent: #4fae94;
            --accent-soft: #182420;
            --paper: #16181c;
            --canvas: #0b0c0e;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, Segoe UI, Roboto, sans-serif;
            margin: 0;
            padding: 48px 20px;
            background-color: var(--canvas);
            color: var(--ink);
            display: flex;
            justify-content: center;
            min-height: 100vh;
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
        body::-webkit-scrollbar {
            display: none;
        }
        .invoice-wrapper {
            background: var(--paper);
            border: 1px solid var(--line);
            border-radius: 10px;
            box-shadow: 0 1px 3px rgba(16, 24, 32, 0.06), 0 8px 24px rgba(16, 24, 32, 0.04);
            max-width: 820px;
            width: 100%;
            overflow: hidden;
            margin: auto;
        }
        .invoice-header {
            padding: 22px 56px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--accent);
        }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand-logo { max-width: 64px; margin-bottom: 0; display: block; }
        .brand-text { display: flex; flex-direction: column; }
        .brand-name {
            margin: 0;
            color: var(--ink);
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.3px;
        }
        .brand p {
            margin: 2px 0 0 0;
            font-size: 11px;
            color: var(--ink-soft);
            line-height: 1.4;
        }
        .invoice-meta { text-align: right; }
        .invoice-meta h2 {
            margin: 0 0 4px 0;
            font-size: 15px;
            color: var(--accent);
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .invoice-meta p {
            margin: 0;
            color: var(--ink);
            font-weight: 600;
            font-size: 13px;
        }
        .invoice-meta .date {
            font-size: 11px;
            color: var(--ink-soft);
            margin-top: 3px;
            font-weight: 400;
        }
        .invoice-body { padding: 36px 56px 15px 56px; }
        .details-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            background: var(--accent-soft);
            padding: 26px 32px;
            border-radius: 8px;
            border: 1px solid var(--line);
            margin-bottom: 10px;
            margin-bottom: 42px;
        }
        .detail-group { display: flex; flex-direction: column; gap: 5px; }
        .detail-label {
            font-size: 11px;
            color: var(--accent);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
            margin: 0;
        }
        .detail-val {
            font-size: 15px;
            color: var(--ink);
            font-weight: 500;
            margin: 0;
        }
        .table-container {
            margin: 0 10px 40px 10px;
            border: 1px solid var(--line);
            border-radius: 8px;
            overflow: hidden;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
        }
        .items-table th {
            text-align: left;
            padding: 14px 20px;
            color: var(--paper);
            background: var(--accent);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            font-weight: 600;
        }
        .items-table th.right { text-align: right; }
        .items-table th.center { text-align: center; }
        .items-table td {
            padding: 16px 20px;
            font-size: 14px;
            border-bottom: 1px solid var(--line);
            color: var(--ink);
        }
        .items-table tr.even td { background: #1c1f24; }
        .items-table td.right { text-align: right; font-weight: 600; }
        .items-table td.center { text-align: center; color: var(--ink-soft); }
        .summary-container { display: flex; justify-content: flex-end; margin-right: 10px; margin-bottom: 10px }
        .summary-box {
            width: 300px;
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 22px 24px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 9px 0;
            color: var(--ink-soft);
            font-size: 13px;
        }
        .summary-row .val { color: var(--ink); font-weight: 500; }
        .summary-row.total {
            margin-top: 8px;
            padding-top: 14px;
            border-top: 2px solid var(--accent);
            color: var(--ink);
            font-size: 15px;
            font-weight: 700;
        }
        .summary-row.total .val { color: var(--accent); font-size: 19px; }
        .invoice-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 40px;
            background: var(--paper);
            border-top: 1px solid var(--line);
        }
        .footer-message {
            text-align: left;
        }
        .footer-message h3 {
            margin: 0 0 6px 0;
            color: var(--accent);
            font-weight: 700;
            font-size: 16px;
            letter-spacing: 0.5px;
        }
        .footer-message p {
            margin: 0;
            color: var(--ink-soft);
            font-size: 13px;
        }
        .footer-contact {
            display: flex;
            flex-direction: column;
            gap: 8px;
            text-align: right;
        }
        .contact-item {
            font-size: 13px;
            color: var(--ink);
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
        }
        .contact-item span {
            font-size: 14px;
            opacity: 0.9;
        }

        @media print {
            body { background-color: #fff !important; padding: 0 !important; align-items: flex-start; }
            .invoice-wrapper { box-shadow: none !important; border: none !important; border-radius: 0; max-width: 100%; }
            .details-grid { background: #fff !important; border: 1px solid #ddd !important; padding: 20px 25px; border-radius: 8px; box-shadow: none !important; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        }
    </style>
</head>
<body>
    <div class="invoice-wrapper">
        <div class="invoice-header">
            <div class="brand">
                ${logoHtml}
                <div class="brand-text">
                    ${brandTextHtml}
                </div>
            </div>
            <div class="invoice-meta">
                <h2>Invoice</h2>
                <p>#${orderData.ordno}</p>
                <div class="date">Date: ${orderData.orddate}</div>
            </div>
        </div>
        <div class="invoice-body">
            <div class="details-grid">
                <div class="detail-group"><span class="detail-label">Customer Name</span><p class="detail-val">${orderData.customer || 'Guest'}</p></div>
                <div class="detail-group"><span class="detail-label">Table Number</span><p class="detail-val">${orderData.tblno}</p></div>
                <div class="detail-group"><span class="detail-label">Service Type</span><p class="detail-val">${orderData.service}</p></div>
                <div class="detail-group"><span class="detail-label">Payment Mode</span><p class="detail-val">${orderData.paymentmode}</p></div>
            </div>

            <div class="table-container">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item Description</th>
                            <th class="right">Price</th>
                            <th class="center">Qty</th>
                            <th class="right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>

            <div class="summary-container">
                <div class="summary-box">
                    <div class="summary-row"><span>Subtotal</span><span class="val">₹ ${String(orderData.amount).replace(/₹/g, '').replace(/Rs\./g, '').trim()}</span></div>
                    ${orderData.includetip === 1 ? `<div class="summary-row"><span>Tip</span><span class="val">₹ ${String(orderData.tipamount || '0').replace(/₹/g, '').replace(/Rs\./g, '').trim()}</span></div>` : ''}
                    <div class="summary-row"><span>Tax (${orderData.taxpercent}%)</span><span class="val">₹ ${String(orderData.taxamount).replace(/₹/g, '').replace(/Rs\./g, '').trim()}</span></div>
                    <div class="summary-row total"><span>Total Amount</span><span class="val">₹ ${String(orderData.totalamount).replace(/₹/g, '').replace(/Rs\./g, '').trim()}</span></div>
                </div>
            </div>
        </div>
        <div class="invoice-footer">
            <div class="footer-message">
                <h3>Thank You!</h3>
                <p>We hope to see you again soon at Moonlight Cafe.</p>
            </div>
            <div class="footer-contact">
                <div class="contact-item"><span>📞</span> +1 (555) 123-4567</div>
                <div class="contact-item"><span>✉️</span> hello@moonlightcafe.com</div>
            </div>
        </div>
    </div>
</body>
</html>`;

                        const htmlBuffer = Buffer.from(htmlString, 'utf-8');
                        const uploadResult = await new Promise((res, rej) => {
                                cloudinary.uploader.upload_stream(
                                        {
                                                folder: "bills",
                                                resource_type: "raw",
                                                public_id: orderData.ordno + ".html",
                                                format: "html",
                                                use_filename: true,
                                                unique_filename: false,
                                                overwrite: true,
                                                access_mode: "public"
                                        },
                                        (error, result) => {
                                                if (error) rej(error);
                                                else res(result);
                                        }
                                ).end(htmlBuffer);
                        });
                        return uploadResult.secure_url;
                } catch (err) {
                        console.error("Bill HTML Error:", err);
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
