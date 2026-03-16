import { Config, Methods, MainDB } from "../../config/Init.js"
import _OTP from "../../model/ForgetPassword.js"
import _CustomerDetails from "../../model/CustomerDetails/CustomerDetails.js"
import _Employees from "../../model/Employees.js"

const ObjectId = Methods.getObjectId()
class OTP {
        async OTPSend(req, res, next) {
                try {
                        const { email } = req.body;

                        if (!email) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Email is required"
                                };
                                return next();
                        }

                        let fetchdata = await MainDB.getmenual("tblcafe_customerdetails", new _CustomerDetails(), [{ $match: { email: email } }]);

                        // If not found anywhere
                        if (!fetchdata.ResultData.length) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Email not found"
                                };
                                return next();
                        }

                        const person = fetchdata.ResultData[0];

                        // Double check email correctness
                        if (person.email !== email) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: Config.errmsg['invalidemail']
                                };
                                return next();
                        }

                        // Generate OTP
                        const otp = Methods.generateRandomNumber(6);
                        console.log("Generated OTP:", otp);

                        const data = {
                                customerid: new ObjectId(person._id),
                                customeremail: email,
                                oldpassword: person.password,
                                newpassword: "",
                                otp: otp,
                                attempt: 0,
                                isverified: 0
                        };

                        const check = await MainDB.executedata('i', new _OTP(), "tblcafe_forgetpasswords", data);

                        if (check.status !== 200) {
                                req.ResponseBody = {
                                        status: 500,
                                        message: "Failed to generate OTP"
                                };
                                return next();
                        }

                        let template = Config.emailtemplates['forgotpassword'];
                        let senddata = {
                                name: person.name,
                                otp: otp
                        };

                        // Send email
                        await MainDB.sendMail('', [email], template, '', senddata);

                        req.ResponseBody = {
                                status: 200,
                                message: "OTP has been sent to your email"
                        };
                        return next();

                } catch (err) {
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        };
                        return next();
                }
        }

        async AdminOTPSend(req, res, next) {
                try {
                        const { email } = req.body;

                        if (!email) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Email is required"
                                };
                                return next();
                        }

                        let fetchdata = await MainDB.getmenual('tblcafe_employees', new _Employees(), [{ $match: { email: email } }]);
                        if (!fetchdata.ResultData.length) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Email not found"
                                };
                                return next();
                        }

                        const person = fetchdata.ResultData[0];

                        // Double check email correctness
                        if (person.email !== email) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: Config.errmsg['invalidemail']
                                };
                                return next();
                        }

                        // Generate OTP
                        const otp = Methods.generateRandomNumber(6);
                        console.log("Generated OTP:", otp);

                        const data = {
                                customerid: new ObjectId(person._id),
                                customeremail: email,
                                oldpassword: person.password,
                                newpassword: "",
                                otp: otp,
                                attempt: 0,
                                isverified: 0
                        };

                        const check = await MainDB.executedata('i', new _OTP(), "tblcafe_forgetpasswords", data);

                        if (check.status !== 200) {
                                req.ResponseBody = {
                                        status: 500,
                                        message: "Failed to generate OTP"
                                };
                                return next();
                        }

                        let template = Config.emailtemplates['forgotpassword'];
                        let senddata = {
                                name: person.name,
                                otp: otp
                        };

                        // Send email
                        await MainDB.sendMail('', [email], template, '', senddata);

                        req.ResponseBody = {
                                status: 200,
                                message: "OTP has been sent to your email"
                        };
                        return next();

                } catch (err) {
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        };
                        return next();
                }
        }

        async OTPverify(req, res, next) {
                try {
                        const email = req.body.email;
                        const enteredOtp = req.body.otp;

                        const otpRecords = await MainDB.getmenual("tblcafe_forgetpasswords", new _OTP(), [{ $match: { customeremail: email } },
                        { $sort: { _id: -1 } },
                        { $limit: 1 },
                        ]);

                        if (!otpRecords || otpRecords.ResultData.length === 0) {
                                req.ResponseBody = {
                                        status: 404,
                                        message: "No OTP found for this customer",
                                };
                                return next();
                        }

                        const otpRecord = otpRecords.ResultData[0];

                        const createdAt = new Date(otpRecord.createdAt);
                        const now = new Date();
                        const diffMs = now - createdAt;
                        const diffMinutes = diffMs / 1000 / 60;

                        if (diffMinutes > 5) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "OTP expired. Please generate a new one.",
                                };
                                return next();
                        }

                        if (otpRecord.attempt >= 3) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Too many attempts. Please Generate New OTP.",
                                };
                                return next();
                        }

                        if (otpRecord.isverified == 1) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "OTP has been Already Verified.",
                                };
                                return next();
                        }


                        if (enteredOtp == otpRecord.otp) {
                                const tokenval = Methods.generateuuid()
                                await MainDB.Update("tblcafe_forgetpasswords", new _OTP(), [{ _id: new ObjectId(otpRecord._id) }, {
                                        isverified: 1,
                                        token: tokenval,
                                        verifiedtoken: 0,
                                        tokentimestamp: Methods.getdatetimeisostr(),
                                }]);

                                req.ResponseBody = {
                                        status: 200,
                                        token: tokenval,
                                        message: "OTP verified successfully",
                                };
                                return next();
                        } else {
                                await MainDB.Update("tblcafe_forgetpasswords", new _OTP(), [{ _id: new ObjectId(otpRecord._id) }, {
                                        attempt: otpRecord.attempt + 1,
                                }]);

                                req.ResponseBody = {
                                        status: 400,
                                        message: "Invalid OTP. Please try again.",
                                        attemptsLeft: 3 - (otpRecord.attempt + 1),
                                };
                                return next();
                        }
                } catch (err) {
                        console.error("Error: ", err);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"],
                        };
                        next();
                }
        }

        async OTPTokenverify(req, res, next) {
                try {
                        let ResponseBody = {}
                        const otpTokenRecords = await MainDB.getmenual("tblcafe_forgetpasswords", new _OTP(), [{ $match: { customeremail: req.body.email, isverified: 1, verifiedtoken: 0 } },
                        { $sort: { _id: -1 } },
                        { $limit: 1 },
                        ]);

                        if (otpTokenRecords.ResultData.length == 0) {
                                req.ResponseBody = {
                                        status: 404,
                                        message: "No OTP found..!",
                                };
                                return next();
                        }

                        if (req.body.token != otpTokenRecords.ResultData[0].token) {
                                ResponseBody.status = 400
                                ResponseBody.message = "Invalid Token"
                        }

                        const createdAt = new Date(otpTokenRecords.ResultData[0].tokentimestamp);
                        const now = new Date();
                        const diffMs = now - createdAt;
                        const diffMinutes = diffMs / 1000 / 60;

                        if (diffMinutes > 5) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Token has expired. Please Try Again Later.",
                                };
                                return next();
                        }

                        await MainDB.Update("tblcafe_forgetpasswords", new _OTP(), [{ _id: new ObjectId(otpTokenRecords.ResultData[0]._id) }, {
                                verifiedtoken: 1,
                        }]);

                        req.ResponseBody = {
                                status: 200,
                                message: "Token verified successfully",
                        };
                        next()

                } catch (error) {
                        console.error("Error: ", err);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"],
                        };
                        next();
                }
        }
}

export default OTP