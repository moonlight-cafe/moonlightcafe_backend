import CryptoJS from "crypto-js"
import crypto from 'crypto'
import ObjectId from 'mongoose'
import { promisify } from 'util'
import { Config, MainDB, cloudinary } from "./Init.js"
import _CustomerDetails from "../model/CustomerDetails/CustomerDetails.js"
import path from 'path'
import fs from 'fs'
import axios from "axios";
import puppeteer from "puppeteer";
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
                let browser;

                try {
                        browser = await puppeteer.launch({
                                headless: "new",
                                args: ["--no-sandbox", "--disable-setuid-sandbox"]
                        });

                        const page = await browser.newPage();

                        /* ================== HTML TEMPLATE ================== */
                        const html = `
                                <!DOCTYPE html>
                                <html>
                                        <head>
                                                <meta charset="UTF-8">
                                                <style>
                                                        body {
                                                                margin: 0;
                                                                padding: 40px 0;
                                                                background: #121212;
                                                                font-family: 'Segoe UI', sans-serif;
                                                                color: #f0f0f0;
                                                        }

                                                        .container {
                                                                max-width: 80%;
                                                                margin: auto;
                                                                background: #1e1e1e;
                                                                border-radius: 15px;
                                                                border: 1px solid #47d9a8;
                                                                box-shadow: 0 0 20px rgba(71, 217, 168, 0.25);
                                                                overflow: hidden;
                                                        }

                                                        /* HEADER */
                                                        .header {
                                                                background: #111;
                                                                text-align: center;
                                                                padding: 20px;
                                                                border-bottom: 2px solid #47d9a8;
                                                        }

                                                        .title {
                                                                text-align: center;
                                                                color: #47d9a8;
                                                                margin: 20px 0 10px;
                                                                font-size: 22px;
                                                        }

                                                        /* BOXES */
                                                        .box {
                                                                margin: 20px;
                                                                border: 1px solid #47d9a8;
                                                                border-radius: 10px;
                                                                overflow: hidden;
                                                                background: #1f1f1f;
                                                        }

                                                        /* TABLE */
                                                        .table {
                                                                width: 100%;
                                                                border-collapse: collapse;
                                                                table-layout: fixed;
                                                        }

                                                        .table td {
                                                                padding: 10px;
                                                                border-bottom: 1px solid #333;
                                                                font-size: 14px;
                                                        }

                                                        .table td:last-child {
                                                                text-align: right;
                                                        }

                                                        /* ITEMS TABLE */
                                                        .items th {
                                                                background: #47d9a8;
                                                                color: #111;
                                                                padding: 10px;
                                                                font-size: 14px;
                                                        }

                                                        .items td {
                                                                padding: 10px;
                                                                border-bottom: 1px solid #333;
                                                        }

                                                        .items td:nth-child(2) {
                                                                text-align: center;
                                                                width: 15%;
                                                        }

                                                        .items td:last-child {
                                                                text-align: right;
                                                                width: 25%;
                                                        }

                                                        /* TOTAL */
                                                        .total-row td {
                                                                font-size: 16px;
                                                                font-weight: bold;
                                                        }

                                                        .total-amount {
                                                                color: #47d9a8;
                                                                font-size: 18px;
                                                        }

                                                        /* FOOTER */
                                                        .footer {
                                                                text-align: center;
                                                                padding: 20px;
                                                                color: #bbb;
                                                                font-size: 13px;
                                                        }
                                                        .section-title {
                                                                text-align: center;
                                                                padding: 12px 10px;
                                                                border-bottom: 1px solid #333;
                                                                background: #181818;
                                                        }

                                                        .section-title h3 {
                                                                margin: 0;
                                                                color: #47d9a8;
                                                                font-size: 15px;
                                                                letter-spacing: 1px;
                                                                font-weight: 600;
                                                        }
                                                </style>
                                        </head>

                                        <body>

                                                <div class="container">

                                                        <!-- HEADER -->
                                                        <div class="header">
                                                                <img src="https://res.cloudinary.com/dqdv99ydb/image/upload/v1749141918/tempfolder/gmd4nf2stova0qct7h3o.png" width="110">
                                                        </div>

                                                        <div class="title">Bill Receipt</div>

                                                        <!-- ORDER DETAILS -->
                                                        <div class="box">
                                                                <table class="table">
                                                                       <tr>
                                                                                <td colspan="2" class="section-title">
                                                                                        <h3>ORDER DETAILS</h3>
                                                                                </td>
                                                                        </tr>
                                                                        <tr>
                                                                                <td>Order No</td>
                                                                                <td style="color:#47d9a8;"><strong>${orderData.ordno}</strong></td>
                                                                        </tr>
                                                                        <tr>
                                                                                <td>Date</td>
                                                                                <td>${orderData.orddate}</td>
                                                                        </tr>
                                                                        <tr>
                                                                                <td>Customer</td>
                                                                                <td>${orderData.customer}</td>
                                                                        </tr>
                                                                        <tr>
                                                                                <td>Table No</td>
                                                                                <td>${orderData.tblno}</td>
                                                                        </tr>
                                                                        <tr>
                                                                                <td>Service Type</td>
                                                                                <td>${orderData.service}</td>
                                                                        </tr>
                                                                        <tr>
                                                                                <td>Payment Mode</td>
                                                                                <td>${orderData.paymentmode}</td>
                                                                        </tr>
                                                                </table>
                                                        </div>

                                                        <!-- ITEMS -->
                                                        <div class="box">
                                                                <table class="table items">
                                                                        <thead>
                                                                                <tr>
                                                                                        <th style="width:60%; text-align:left;">Item</th>
                                                                                        <th style="width:15%; text-align:center;">Qty</th>
                                                                                        <th style="width:25%; text-align:right;">Price</th>
                                                                                </tr>
                                                                        </thead>

                                                                        <tbody>
                                                                ${orderData.data.map(item => `
                                                                        <tr>
                                                                                <td>${item.foodname}</td>
                                                                                <td style="text-align:center;">${item.quantity}</td>
                                                                                <td style="text-align:right;">₹${item.price}</td>
                                                                        </tr>
                                                                `).join("")}
                                                                </tbody>
                                                                </table>
                                                        </div>

                                                        <!-- SUMMARY -->
                                                        <div class="box">
                                                                <table class="table">
                                                                     <tr>
                                                                                <td colspan="2" class="section-title">
                                                                                        <h3>PAYMENT SUMMARY</h3>
                                                                                </td>
                                                                        </tr>
                                                                        <tr>
                                                                                <td>Subtotal</td>
                                                                                <td>${orderData.amount}</td>
                                                                        </tr>
                                                                        <tr>
                                                                                <td>Tip</td>
                                                                                <td>${orderData.tipamount || "₹0"}</td>
                                                                        </tr>
                                                                        <tr>
                                                                                <td>Tax (${orderData.taxpercent}%)</td>
                                                                                <td>${orderData.taxamount}</td>
                                                                        </tr>
                                                                        <tr class="total-row">
                                                                                <td>Total Amount</td>
                                                                                <td class="total-amount">${orderData.totalamount}</td>
                                                                        </tr>
                                                                </table>
                                                        </div>

                                                        <!-- FOOTER -->
                                                        <div class="footer">
                                                                Thank you for dining with us!<br>
                                                                <a href="${Config.moonlightcafe}" style="color:#47d9a8; text-decoration:none; font-weight:600; letter-spacing:0.5px;"><strong style="color:#47d9a8;">Moonlight Cafe</strong></a>
                                                        </div>

                                                </div>

                                        </body>
                                </html>
                                `;

                        /* ================== LOAD HTML ================== */
                        await page.setContent(html, { waitUntil: "networkidle0" });

                        /* ================== GENERATE PDF ================== */
                        const pdfBuffer = await page.pdf({
                                format: "A4",
                                printBackground: true
                        });

                        /* ================== UPLOAD TO CLOUDINARY ================== */
                        const uploadResult = await new Promise((resolve, reject) => {
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
                                                if (error) reject(error);
                                                else resolve(result);
                                        }
                                ).end(pdfBuffer);
                        });

                        return uploadResult.secure_url;

                } catch (err) {
                        console.error("Bill PDF Error:", err);
                        throw err;
                } finally {
                        if (browser) await browser.close();
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
                return new Date().toISOString().
                        replace(/T/, ' ').      // replace T with a space
                        replace(/\..+/, '')
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
