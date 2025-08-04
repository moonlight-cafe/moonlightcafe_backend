import { Config, Methods, MainDB } from "../../config/Init.js"
import _CustomerDetails from "../../CustomerDetails/CustomerDetails.js"

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
                                create_at: Methods.getdatetimeisostr(),
                                updated_at: Methods.getdatetimeisostr(),
                        };

                        data.password = Methods.encryptPassword(password, data.create_at);


                        const check = await MainDB.executedata('i', new _CustomerDetails(), "tblcafe_customerdetails", data);

                        let template = Config.emailtemplates['welcomeletter'];
                        let senddata = {
                                name: name,
                        };
                        await MainDB.sendMail(2, '', [email], template, '', senddata);

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
                        const { code, password } = req.body;

                        if (!code || !password) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Please provide both email/number and password."
                                };
                                return next();
                        }

                        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(code);
                        const matchField = isEmail ? { email: code } : { number: code };

                        const userResult = await MainDB.getmenual("tblcafe_customerdetails", new _CustomerDetails(), [
                                { $match: matchField }
                        ]);

                        const user = userResult.ResultData[0];

                        if (!user) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "No account found with this email or number."
                                };
                                return next();
                        }

                        // Check if account is locked
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
                                // Increase failed login attempts
                                const newAttempts = (user.failedLoginAttempts || 0) + 1;

                                const updateFields = {
                                        failedLoginAttempts: newAttempts
                                };

                                if (newAttempts >= 5) {
                                        updateFields.lockUntil = new Date(Date.now() + 2 * 60 * 1000); // 10 minutes
                                        updateFields.failedLoginAttempts = 0; // reset count after locking
                                }

                                const check = await MainDB.Update("tblcafe_customerdetails", new _CustomerDetails(), [{ _id: user._id }, updateFields]);


                                req.ResponseBody = {
                                        status: 400,
                                        message: "Invalid Password!"
                                };
                                return next();
                        }

                        // Successful login: reset failed attempts
                        await MainDB.Update("tblcafe_customerdetails", user._id, {
                                failedLoginAttempts: 0,
                                lockUntil: null
                        });

                        const uid = user._id;
                        const unqkey = Methods.generateuuid();
                        const token = await MainDB.getjwt(uid, unqkey);

                        req.ResponseBody = {
                                status: 200,
                                message: "Success! You're logged in.",
                                name: user.name,
                                number: user.number,
                                email: user.email,
                                _id: user._id,
                                token: token
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

}


export default Signup
