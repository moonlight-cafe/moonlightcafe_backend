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
                        await MainDB.sendMail(2, 'lagurudhrapujaday1@gmail.com', [email], template, '', senddata);

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
                                return next()
                        }

                        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(code);
                        const matchField = isEmail ? { email: code } : { number: code };

                        // const userResult = await MainDB.getmenual("tblcafe_employees", new _Employees(), [
                        //         { $match: matchField }
                        // ]);
                        const userResult = await MainDB.getmenual("tblcafe_customerdetails", new _CustomerDetails(), [
                                { $match: matchField }
                        ]);

                        const user = userResult.ResultData[0];

                        if (!user) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "No account found with this email or number."
                                };
                                return next()
                        }

                        const isMatch = Methods.decryptPassword(user.password, user.create_at);
                        if (isMatch !== password) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Invalid Password!"
                                }
                                return next()
                        }

                        const uid = user._id
                        const unqkey = Methods.generateuuid()

                        var token = await MainDB.getjwt(uid, unqkey)

                        req.ResponseBody = {
                                status: 200,
                                message: "Success! You're logged in.",
                                name: userResult.ResultData[0].name,
                                number: userResult.ResultData[0].number,
                                email: userResult.ResultData[0].email,
                                _id: userResult.ResultData[0]._id,

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
