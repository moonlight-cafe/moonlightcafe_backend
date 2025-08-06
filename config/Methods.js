import CryptoJS from "crypto-js"
import crypto from 'crypto'
import ObjectId from 'mongoose'
import { promisify } from 'util'
import { Config, MainDB } from "./Init.js"
import path from 'path'
import fs from 'fs'

const Objectid = ObjectId.Types.ObjectId

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
                if (name === "") {
                        return "tempfolder";
                }
                return name
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
        GetIndianTimestamp() {
                return moment().utcOffset("+05:30").format();
        }
}
export default Methods;