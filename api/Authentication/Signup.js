import { Config, Methods, MainDB } from "../../config/Init.js"
import _CustomerDetails from "../../model/CustomerDetails/CustomerDetails.js"
import _Employees from "../../model/Employees.js"
import _FireBaseToken from "../../model/FireBaseToken.js"
import _BGImages from "../../model/BGImages.js"
import _Permissions from "../../model/Permissions.js"
import _MenuModel from "../../model/MenuModel.js"

const ObjectId = Methods.getObjectId()
class Signup {
        async health(req, res, next) {
                var ResponseBody = {}
                ResponseBody.status = 401
                ResponseBody.message = Config.resstatuscode['401']
                try {
                        res.status(200).send({ message: "healthy" });
                }
                catch (err) {
                        req.ResponseBody = { status: 500, message: Config.resstatuscode["500"], err }
                        next()
                }
        }

        async Getaccesstoken(req, res, next) {
                try {
                        var ResponseBody = {}
                        var ResponseHeaders = {}
                        ResponseBody.status = 401
                        ResponseBody.message = Config.getResponsestatuscode()['401']
                        if (Methods.VerifyGetaccessToken(req.headers.key, req.headers.unqkey, req.headers.unqid, req.headers.id)) {
                                var unqkey = Methods.generateuuid()
                                var iss = req.headers.issuer
                                var uid = 'guest-' + req.headers['user-agent']
                                var aud = req.headers.host
                                let resp = await MainDB.getmenual(
                                        "tblcafe_employees",
                                        new _Employees(),
                                        [
                                                {
                                                        $match: {
                                                                $or: [
                                                                        { email: req.headers.code },
                                                                        { uniqueid: req.headers.code },
                                                                        { number: req.headers.code }
                                                                ]
                                                        }
                                                }
                                        ]
                                );
                                if (!resp.ResultData.length) {
                                        ResponseBody.status = 400
                                        ResponseBody.message = "Invalid Details"
                                        req.ResponseBody = ResponseBody
                                        return next()
                                }
                                uid = resp.ResultData[0]._id
                                var token = await MainDB.getjwt(uid, unqkey, iss, req.headers['user-agent'], aud)

                                ResponseBody.status = 200
                                ResponseBody.message = Config.getResponsestatuscode()['200']
                                ResponseHeaders.token = token
                                ResponseHeaders.iss = iss
                                ResponseHeaders.unqkey = unqkey
                                ResponseHeaders.uid = uid
                        } else {
                                ResponseBody.status = 401
                                ResponseBody.message = Config.getResponsestatuscode()['401']
                        }
                        let status = ResponseBody['status']
                        console.log('Received Token:', req.headers.key);
                        console.log('Issuer:', req.headers.issuer);

                        res.set(ResponseHeaders)
                        res.status(status).send(ResponseBody);


                } catch (err) {
                        req.ResponseBody = { status: 500, message: Config.resstatuscode["500"], err }
                        next()
                }
        }

        async CustomerGetaccesstoken(req, res, next) {
                try {
                        var ResponseBody = {}
                        var ResponseHeaders = {}
                        ResponseBody.status = 401
                        ResponseBody.message = Config.getResponsestatuscode()['401']
                        if (Methods.VerifyGetaccessToken(req.headers.key, req.headers.unqkey, req.headers.unqid, req.headers.id)) {
                                var unqkey = Methods.generateuuid()
                                var iss = req.headers.issuer
                                var uid = 'guest-' + req.headers['user-agent']
                                var aud = req.headers.host
                                let resp = await MainDB.getmenual(
                                        "tblcafe_customerdetails",
                                        new _CustomerDetails(),
                                        [
                                                {
                                                        $match: {
                                                                $or: [
                                                                        { email: req.headers.code },
                                                                        { uniqueid: req.headers.code },
                                                                        { number: req.headers.code }
                                                                ]
                                                        }
                                                }
                                        ]
                                );
                                if (!resp.ResultData.length) {
                                        ResponseBody.status = 400
                                        ResponseBody.message = "Invalid Details"
                                        req.ResponseBody = ResponseBody
                                        return next()
                                }
                                uid = resp.ResultData[0]._id
                                var token = await MainDB.getjwt(uid, unqkey, iss, req.headers['user-agent'], aud)

                                ResponseBody.status = 200
                                ResponseBody.message = Config.getResponsestatuscode()['200']
                                ResponseHeaders.token = token
                                ResponseHeaders.iss = iss
                                ResponseHeaders.unqkey = unqkey
                                ResponseHeaders.uid = uid
                        } else {
                                ResponseBody.status = 401
                                ResponseBody.message = Config.getResponsestatuscode()['401']
                        }
                        let status = ResponseBody['status']
                        console.log('Received Token:', req.headers.key);
                        console.log('Issuer:', req.headers.issuer);

                        res.set(ResponseHeaders)
                        res.status(status).send(ResponseBody);
                } catch (err) {
                        req.ResponseBody = { status: 500, message: Config.resstatuscode["500"], err }
                        next()
                }
        }

        async Register(req, res, next) {
                try {
                        const { name, number, email, password, confirmPassword } = req.body;

                        if (!name || !number || !email || !password || !confirmPassword) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: Config.errmsg['requireddata']
                                }
                                next()
                        }

                        if (password !== confirmPassword) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: Config.errmsg['notexist']
                                }
                                next()
                        }

                        const verifypwd = Methods.validatePassword(password);
                        if (verifypwd.status !== 200) {
                                console.error("Password validation failed:", verifypwd.message);
                                return res.status(verifypwd.status).json(verifypwd);
                        }

                        const validatedata = Methods.validateEmailAndPhone(email, number);
                        if (validatedata.status === 400) {
                                req.ResponseBody = {
                                        status: validatedata.status,
                                        message: validatedata.message
                                };
                                return next();
                        }

                        const checkUser = await MainDB.getmenual("tblcafe_customerdetails", new _CustomerDetails(), [{
                                $match: {
                                        $or: [{ number: number }, { email: email }]
                                }
                        }]);

                        if (checkUser?.ResultData?.length > 0) {
                                const existing = checkUser.ResultData[0];
                                let errorMessage = "Email or mobile already exists.";
                                if (existing.email === email && existing.number === number) {
                                        errorMessage = "Both email and mobile number are already registered.";
                                } else if (existing.email === email) {
                                        errorMessage = "This email is already registered.";
                                } else if (existing.number === number) {
                                        errorMessage = "This mobile number is already registered.";
                                }

                                req.ResponseBody = {
                                        status: 400,
                                        message: errorMessage
                                };
                                return next();
                        }

                        const data = {
                                name,
                                number,
                                email,
                                create_at: Methods.getdatetimeisostr()
                        };

                        data.password = Methods.encryptPassword(password, data.create_at);
                        data.uniqueid = await Methods.GetRandomCustomerId()

                        const check = await MainDB.executedata('i', new _CustomerDetails(), "tblcafe_customerdetails", data);

                        let template = Config.emailtemplates['welcomeletter'];
                        let senddata = {
                                name: name,
                        };
                        await MainDB.sendMail('', [email], template, '', senddata);

                        req.ResponseBody = {
                                status: check.status,
                                message: check.status == 200 ? "Registration successful" : check.message
                        };
                        return next();

                } catch (error) {
                        console.error(error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"],
                                error: error.message || error
                        };
                        return next();
                }
        }

        async Login(req, res, next) {
                try {
                        const { email, password } = req.body;

                        if (!email || !password) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Please provide both email/number and password."
                                };
                                return next();
                        }
                        const chkdata = await Methods.CheckEmailMobileNumberCustomerCodeForLogin(email)
                        const user = chkdata.data;

                        if (!user) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: chkdata.message
                                        // message: "No account found with this Email or Number."
                                };
                                return next();
                        }

                        const now = new Date();

                        if (user.lockUntil && user.lockUntil > now) {
                                const minutes = Math.ceil((user.lockUntil - now) / (60 * 1000));
                                req.ResponseBody = {
                                        status: 403,
                                        message: `Account is temporarily locked. Try again in ${minutes} minute(s).`
                                };
                                return next();
                        }

                        const isMatch = Methods.decryptPassword(user.password, user.create_at);
                        if (isMatch !== password) {
                                const newAttempts = (user.failedLoginAttempts || 0) + 1;

                                const updateFields = {
                                        failedLoginAttempts: newAttempts
                                };

                                if (newAttempts >= 5) {
                                        updateFields.lockUntil = new Date(Date.now() + 2 * 60 * 1000); // 10 minutes
                                        updateFields.failedLoginAttempts = 0; // reset count after locking
                                }

                                await MainDB.Update("tblcafe_customerdetails", new _CustomerDetails(), [{ _id: user._id }, updateFields]);


                                req.ResponseBody = {
                                        status: 400,
                                        message: "Invalid Password!"
                                };
                                return next();
                        }

                        await MainDB.Update("tblcafe_customerdetails", new _CustomerDetails(), [{ _id: user._id }, {
                                failedLoginAttempts: 0,
                                lockUntil: null
                        }]);

                        req.ResponseBody = {
                                status: 200,
                                message: "Success! You're logged in.",
                                name: user.name,
                                number: user.number,
                                uniqueid: user.uniqueid,
                                email: user.email,
                                _id: user._id
                        };

                        return next();
                } catch (error) {
                        console.error("Login error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"],
                                error: error.message || error
                        };
                        return next();
                }
        }

        async AdminLogin(req, res, next) {
                try {
                        const fetchdata = await MainDB.getmenual('tblcafe_employees', new _Employees(), [{ $match: { email: req.body.email } }]);

                        if (!fetchdata.ResultData.length) {
                                req.ResponseBody = { status: 400, message: "Employee not found" };
                                return next();
                        }

                        const employee = fetchdata.ResultData[0];
                        const now = new Date();

                        if (employee.lockUntil && employee.lockUntil > now) {
                                const minutes = Math.ceil((employee.lockUntil - now) / (60 * 1000));
                                req.ResponseBody = { status: 403, message: `Account locked. Try again in ${minutes} minute(s).` };
                                return next();
                        }

                        if (employee.status == 0 && employee.lockUntil == null) {
                                req.ResponseBody = { status: 403, message: "Your account has been disabled." };
                                return next();
                        }

                        const isMatch = Methods.decryptPassword(employee.password, employee.create_at);
                        if (isMatch !== req.body.password) {
                                const newAttempts = (employee.failedLoginAttempts || 0) + 1;
                                const updateFields = { failedLoginAttempts: newAttempts };

                                if (newAttempts >= 5) {
                                        updateFields.lockUntil = new Date(Date.now() + 2 * 60 * 1000);
                                        updateFields.failedLoginAttempts = 0;
                                        updateFields.status = 0
                                }

                                await MainDB.Update("tblcafe_employees", new _Employees(), [{ _id: employee._id }, updateFields]);

                                req.ResponseBody = { status: 400, message: "Invalid Password!" };
                                return next();
                        }

                        // ✅ Reset failed attempts
                        await MainDB.Update("tblcafe_employees", new _Employees(), [{ _id: employee._id }, { failedLoginAttempts: 0, lockUntil: null, status: 1 }]);

                        if (employee.twoFactorEnabled === 1) {
                                const twoFactorTempToken = Methods.generateuuid();
                                const twoFactorTempTokenExpiry = new Date(Date.now() + (5 * 60 * 1000)).toISOString();

                                await MainDB.Update("tblcafe_employees", new _Employees(), [{ _id: employee._id }, {
                                        twoFactorTempToken,
                                        twoFactorTempTokenExpiry
                                }]);

                                req.ResponseBody = {
                                        status: 200,
                                        message: "2FA verification required.",
                                        requires2FA: true,
                                        tempToken: twoFactorTempToken,
                                        email: employee.email
                                };
                                return next();
                        }

                        req.ResponseBody = {
                                status: 200,
                                message: "Success! You're logged in.",
                                data: {
                                        name: employee.name,
                                        number: employee.number,
                                        uniqueid: employee.uniqueid,
                                        email: employee.email,
                                        role: employee.role,
                                        _id: employee._id,
                                        darkmodeaccess: employee.darkmodeaccess,
                                        twoFactorEnabled: employee.twoFactorEnabled || 0
                                }
                        }
                        return next();

                } catch (error) {
                        console.error("Login error:", error);
                        req.ResponseBody = { status: 500, message: "Internal Server Error", error: error.message };
                        return next();
                }
        }

        async GoogleLogin(req, res, next) {
                try {
                        const { name, email, number } = req.body;

                        if (!email || !name) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Name and email are required for Google login."
                                };
                                return next();
                        }

                        const userResult = await MainDB.getmenual("tblcafe_customerdetails", new _CustomerDetails(), [
                                {
                                        $match: { email: email }
                                }
                        ]);

                        let user = userResult.ResultData[0];

                        if (!user) {
                                const now = Methods.getdatetimeisostr();
                                const password = Methods.generateRandomString(16)

                                const registerData = {
                                        name,
                                        email,
                                        number: number || "",
                                        create_at: now,
                                        isGoogleAccount: 1,
                                        // password: password
                                };

                                registerData.password = Methods.encryptPassword(password, now);
                                registerData.uniqueid = await Methods.GetRandomCustomerId()

                                const insertRes = await MainDB.executedata('i', new _CustomerDetails(), "tblcafe_customerdetails", registerData);

                                if (insertRes.status !== 200) {
                                        req.ResponseBody = {
                                                status: 500,
                                                message: "User registration via Google failed."
                                        };
                                        return next();
                                }

                                let template = Config.emailtemplates['googleloginmail'];
                                let senddata = {
                                        name: name,
                                        email: email,
                                        password: password
                                };
                                await MainDB.sendMail('', [email], template, '', senddata);
                                user = registerData;
                                user._id = insertRes.data._id;
                        }

                        req.ResponseBody = {
                                status: 200,
                                message: "Google login successful",
                                name: user.name,
                                number: user.number,
                                uniqueid: user.uniqueid,
                                email: user.email,
                                _id: user._id
                        };
                        return next();
                } catch (error) {
                        console.error("Google login error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"],
                                error: error.message || error
                        };
                        return next();
                }
        }

        async GoogleLoginEmployee(req, res, next) {
                try {
                        const { name, email, number } = req.body;

                        if (!email || !name) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Name and email are required for Google login."
                                };
                                return next();
                        }

                        // 🔍 Check employee existence
                        const empResult = await MainDB.getmenual("tblcafe_employees", new _Employees(), [{ $match: { email: email } }]);

                        const employee = empResult.ResultData[0];

                        // ❌ Employee not found
                        if (!employee) {
                                req.ResponseBody = {
                                        status: 404,
                                        message: "Employee email does not exist. Please contact admin."
                                };
                                return next();
                        }

                        // ❌ Optional: block inactive employees
                        if (employee.status === 0) {
                                req.ResponseBody = {
                                        status: 403,
                                        message: "Your account is inactive. Please contact admin."
                                };
                                return next();
                        }

                        // ✅ Successful Google Login
                        req.ResponseBody = {
                                status: 200,
                                message: "Employee Google login successful",
                                name: employee.name,
                                email: employee.email,
                                number: employee.number,
                                role: employee.role,
                                empid: employee.empid,
                                _id: employee._id
                        };
                        return next();

                } catch (error) {
                        console.error("Employee Google login error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"],
                                error: error.message || error
                        };
                        return next();
                }
        }

        async SetupAdmin2FA(req, res, next) {
                try {
                        const uid = req.headers.uid;

                        if (!uid || !ObjectId.isValid(uid)) {
                                req.ResponseBody = { status: 400, message: "Invalid employee id." };
                                return next();
                        }

                        const fetchdata = await MainDB.getmenual("tblcafe_employees", new _Employees(), [{ $match: { _id: new ObjectId(uid) } }]);
                        const employee = fetchdata.ResultData[0];

                        if (!employee) {
                                req.ResponseBody = { status: 404, message: "Employee not found." };
                                return next();
                        }

                        const secret = Methods.generateBase32Secret();
                        const encryptedSecret = Methods.encryptPassword(secret, employee.create_at);
                        const issuer = "MoonlightCafe Admin";
                        const accountName = employee.email || employee.employeeid || String(employee._id);
                        const otpauthUrl = Methods.buildOtpAuthUrl({ issuer, accountName, secret });

                        await MainDB.Update("tblcafe_employees", new _Employees(), [{
                                _id: employee._id
                        }, {
                                twoFactorSecret: encryptedSecret,
                                twoFactorEnabled: 0
                        }]);

                        req.ResponseBody = {
                                status: 200,
                                message: "2FA setup created.",
                                data: {
                                        secret,
                                        otpauthUrl,
                                        issuer,
                                        accountName
                                }
                        };
                        return next();
                } catch (error) {
                        console.error("SetupAdmin2FA error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"],
                        };
                        return next();
                }
        }

        async EnableAdmin2FA(req, res, next) {
                try {
                        const uid = req.headers.uid;
                        const code = String(req.body.code || "").trim();

                        if (!uid || !ObjectId.isValid(uid) || !/^\d{6}$/.test(code)) {
                                req.ResponseBody = { status: 400, message: "Invalid request." };
                                return next();
                        }

                        const fetchdata = await MainDB.getmenual("tblcafe_employees", new _Employees(), [{ $match: { _id: new ObjectId(uid) } }]);
                        const employee = fetchdata.ResultData[0];

                        if (!employee) {
                                req.ResponseBody = { status: 404, message: "Employee not found." };
                                return next();
                        }

                        if (!employee.twoFactorSecret) {
                                req.ResponseBody = { status: 400, message: "2FA setup is not initialized." };
                                return next();
                        }

                        const secret = Methods.decryptPassword(employee.twoFactorSecret, employee.create_at);
                        const isValid = Methods.verifyTotp(secret, code, 1);
                        if (!isValid) {
                                req.ResponseBody = { status: 400, message: "Invalid authenticator code." };
                                return next();
                        }

                        await MainDB.Update("tblcafe_employees", new _Employees(), [{
                                _id: employee._id
                        }, {
                                twoFactorEnabled: 1,
                                twoFactorTempToken: "",
                                twoFactorTempTokenExpiry: ""
                        }]);

                        req.ResponseBody = {
                                status: 200,
                                message: "2FA enabled successfully."
                        };
                        return next();
                } catch (error) {
                        console.error("EnableAdmin2FA error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"],
                        };
                        return next();
                }
        }

        async DisableAdmin2FA(req, res, next) {
                try {
                        const uid = req.headers.uid;
                        const code = String(req.body.code || "").trim();

                        if (!uid || !ObjectId.isValid(uid) || !/^\d{6}$/.test(code)) {
                                req.ResponseBody = { status: 400, message: "Invalid request." };
                                return next();
                        }

                        const fetchdata = await MainDB.getmenual("tblcafe_employees", new _Employees(), [{ $match: { _id: new ObjectId(uid) } }]);
                        const employee = fetchdata.ResultData[0];

                        if (!employee) {
                                req.ResponseBody = { status: 404, message: "Employee not found." };
                                return next();
                        }

                        if (employee.twoFactorEnabled !== 1 || !employee.twoFactorSecret) {
                                req.ResponseBody = { status: 400, message: "2FA is not enabled." };
                                return next();
                        }

                        const secret = Methods.decryptPassword(employee.twoFactorSecret, employee.create_at);
                        const isValid = Methods.verifyTotp(secret, code, 1);
                        if (!isValid) {
                                req.ResponseBody = { status: 400, message: "Invalid authenticator code." };
                                return next();
                        }

                        await MainDB.Update("tblcafe_employees", new _Employees(), [{
                                _id: employee._id
                        }, {
                                twoFactorEnabled: 0,
                                twoFactorSecret: "",
                                twoFactorTempToken: "",
                                twoFactorTempTokenExpiry: ""
                        }]);

                        req.ResponseBody = {
                                status: 200,
                                message: "2FA disabled successfully."
                        };
                        return next();
                } catch (error) {
                        console.error("DisableAdmin2FA error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"],
                        };
                        return next();
                }
        }

        async VerifyAdmin2FA(req, res, next) {
                try {
                        const { email, tempToken, code } = req.body;

                        if (!email || !tempToken || !/^\d{6}$/.test(String(code || "").trim())) {
                                req.ResponseBody = { status: 400, message: "Email, tempToken and valid code are required." };
                                return next();
                        }

                        const fetchdata = await MainDB.getmenual("tblcafe_employees", new _Employees(), [{
                                $match: { email }
                        }]);
                        const employee = fetchdata.ResultData[0];

                        if (!employee) {
                                req.ResponseBody = { status: 404, message: "Employee not found." };
                                return next();
                        }

                        if (employee.twoFactorEnabled !== 1) {
                                req.ResponseBody = { status: 400, message: "2FA is not enabled for this account." };
                                return next();
                        }

                        if (!employee.twoFactorTempToken || employee.twoFactorTempToken !== tempToken) {
                                req.ResponseBody = { status: 401, message: "Invalid 2FA session token." };
                                return next();
                        }

                        const expiry = new Date(employee.twoFactorTempTokenExpiry || "");
                        if (!employee.twoFactorTempTokenExpiry || Number.isNaN(expiry.getTime()) || expiry.getTime() < Date.now()) {
                                req.ResponseBody = { status: 401, message: "2FA session expired. Please login again." };
                                return next();
                        }

                        const secret = Methods.decryptPassword(employee.twoFactorSecret, employee.create_at);
                        const isValid = Methods.verifyTotp(secret, String(code).trim(), 1);
                        if (!isValid) {
                                req.ResponseBody = { status: 400, message: "Invalid authenticator code." };
                                return next();
                        }

                        await MainDB.Update("tblcafe_employees", new _Employees(), [{
                                _id: employee._id
                        }, {
                                twoFactorTempToken: "",
                                twoFactorTempTokenExpiry: "",
                                failedLoginAttempts: 0,
                                lockUntil: null,
                                status: 1
                        }]);

                        req.ResponseBody = {
                                status: 200,
                                message: "Success! You're logged in.",
                                data: {
                                        name: employee.name,
                                        number: employee.number,
                                        uniqueid: employee.uniqueid,
                                        email: employee.email,
                                        role: employee.role,
                                        _id: employee._id,
                                        darkmodeaccess: employee.darkmodeaccess,
                                        twoFactorEnabled: employee.twoFactorEnabled || 0
                                }
                        }
                        return next();
                } catch (error) {
                        console.error("VerifyAdmin2FA error:", error);
                        req.ResponseBody = { status: 500, message: "Internal Server Error", error: error.message };
                        return next();
                }
        }


        async FetchEmployeeData(req, res, next) {
                try {
                        const fetchdata = await MainDB.getmenual("tblcafe_employees", new _Employees(), [{ $match: { _id: new ObjectId(req.headers.uid) } }])
                        const employee = fetchdata.ResultData[0]
                        let safeEmployee = employee
                        if (employee) {
                                const { password, create_at, failedLoginAttempts, lockUntil, twoFactorSecret, twoFactorTempToken, twoFactorTempTokenExpiry, ...rest } = employee
                                safeEmployee = rest
                        }

                        req.ResponseBody = {
                                status: 200,
                                message: Config.errmsg['datafound'],
                                data: safeEmployee
                        }
                        if (fetchdata.ResultData.length == 0) {
                                req.ResponseBody.status = 404
                                req.ResponseBody.status = Config.resstatuscode['404']
                        }
                        next()

                } catch (error) {
                        console.error("Login error:", error);
                        req.ResponseBody = { status: 500, message: "Internal Server Error", error: error.message };
                        return next();
                }
        }

        async LogOut(req, res, next) {
                try {
                        let ResponseBody = {}
                        const logout = await MainDB.TokenExpireforLogout(req.headers.token, req.headers.uid, req.headers.unqkey)
                        if (logout) {
                                ResponseBody.status = 200
                                ResponseBody.message = "Log Out Success!"
                        } else {
                                ResponseBody.status = 400
                                ResponseBody.message = "Error for Logout!"
                        }
                        req.ResponseBody = ResponseBody
                        next()
                } catch (error) {
                        console.error("Login error:", error);
                        req.ResponseBody = { status: 500, message: "Internal Server Error", error: error.message };
                        return next();
                }
        }

        async GetDeviceToken(req, res, next) {
                try {
                        let ResponseBody = {}

                        if (!req.headers.uid || !req.body.token) {
                                ResponseBody.status = 400
                                ResponseBody.message = "UID and token required"
                                req.ResponseBody = ResponseBody
                                return next()
                        }

                        const deviceBody = {
                                token: req.body.token,
                                uid: req.headers.uid, // KEEP STRING
                                platform: req.headers.platform || "web",
                                useragent: req.headers["user-agent"],
                                ipaddress: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
                                isexpired: 0,
                                appupdate: Methods.getdatetimeisostr(),
                                edate: Methods.getdatetimeisostr()
                        }

                        const existing = await MainDB.FindOne(
                                "tblcafe_firebasetoken",
                                new _FireBaseToken(),
                                { uid: deviceBody.uid, token: deviceBody.token }
                        )

                        let resp
                        if (existing) {
                                deviceBody._id = existing._id
                                resp = await MainDB.executedata("u", new _FireBaseToken(), "tblcafe_firebasetoken", deviceBody)
                        } else {
                                resp = await MainDB.executedata("i", new _FireBaseToken(), "tblcafe_firebasetoken", deviceBody)
                        }

                        ResponseBody.status = resp.status
                        ResponseBody.message = resp.message
                        req.ResponseBody = ResponseBody
                        next()

                } catch (error) {
                        console.error("GetDeviceToken error:", error)
                        req.ResponseBody = { status: 500, message: "Internal Server Error" }
                        next()
                }
        }

        async LoginData(req, res, next) {
                try {
                        let ResponseBody = {}
                        const bgimgs = await MainDB.getmenual("tblcafe_bgimgs", new _BGImages(), [{ $match: { status: 1 } }])
                        let permission = []
                        let employee
                        const uid = req.headers.uid || req.body?.uid
                        const uidObj = ObjectId.isValid(uid) ? new ObjectId(uid) : null
                        if (uidObj) {
                                const employeeResp = await MainDB.getmenual(
                                        "tblcafe_employees",
                                        new _Employees(),
                                        [{ $match: { _id: uidObj } }, {
                                                $project: {
                                                        _id: 1, employeeid: 1, name: 1, number: 1, email: 1, role: 1, roleid: 1, twoFactorEnabled: 1,
                                                }
                                        }]
                                )
                                employee = employeeResp.ResultData[0] || {}
                                if (employee) {
                                        if (employee.roleid.toString() == Config.superadminroleid.toString()) {
                                                const menuresp = await MainDB.getmenual("tblcafe_menu", new _MenuModel(), [{ $match: { isactive: 1 } }, { $sort: { displayorder: 1 } }])
                                                const menus = menuresp.ResultData
                                                const superPerms = menus.map((menu) => ({
                                                        _id: new ObjectId(),
                                                        roleid: employee.roleid,
                                                        employeeid: employee._id,
                                                        menu_id: menu._id,
                                                        menu_name: menu.name,
                                                        menu_alias: menu.redirecturl || menu.name,
                                                        view: 1,
                                                        insert: 1,
                                                        update: 1,
                                                        delete: 1,
                                                }))
                                                permission = superPerms
                                        } else {
                                                const empRightsResp = await MainDB.getmenual(
                                                        "tblcafe_permissions",
                                                        new _Permissions(),
                                                        [{ $match: { employeeid: uidObj } }, { $sort: { _id: 1 } }]
                                                )
                                                const empRights = empRightsResp.ResultData || []
                                                permission = empRights
                                                if (!permission.length && employee.roleid) {
                                                        const roleRightsResp = await MainDB.getmenual(
                                                                "tblcafe_permissions",
                                                                new _Permissions(),
                                                                [{ $match: { roleid: new ObjectId(employee.roleid) } }, { $sort: { _id: 1 } }]
                                                        )
                                                        const roleRights = roleRightsResp.ResultData || []
                                                        permission = roleRights
                                                }
                                        }
                                }
                        }

                        console.log("🚀 ~ Signup.js:926 ~ Signup ~ LoginData ~ permission.length>>", permission.length);

                        if (!permission.length) {
                                const menuresp = await MainDB.getmenual("tblcafe_menu", new _MenuModel(), [{ $match: { isactive: 1, defaultpermission: 1 } }, { $sort: { displayorder: 1 } }])
                                const menus = menuresp.ResultData
                                const defaultmenus = menus.map((menu) => ({
                                        _id: new ObjectId(),
                                        roleid: employee.roleid,
                                        employeeid: employee._id,
                                        menu_id: menu._id,
                                        menu_name: menu.name,
                                        menu_alias: menu.redirecturl || menu.name,
                                        view: 1,
                                        insert: 1,
                                        update: 1,
                                        delete: 1,
                                }))
                                permission = defaultmenus
                        }
                        ResponseBody.status = 200
                        ResponseBody.message = "Success"
                        ResponseBody.data = employee
                        ResponseBody.bgimgs = bgimgs.ResultData.map(data => data.url)
                        ResponseBody.permission = permission
                        req.ResponseBody = ResponseBody
                        next()
                } catch (error) {
                        console.log("🚀 ~ Signup.js:667 ~ Signup ~ LoginData ~ error>>", error);
                        req.ResponseBody = { status: 500, message: "Internal Server Error" }
                        next()
                }
        }

}


export default Signup
