import { Config, Methods, MainDB } from "../../config/Init.js"
import _OTP from "../../model/ForgetPassword.js"
import _CustomerDetails from "../../CustomerDetails/CustomerDetails.js"

const ObjectId = Methods.getObjectId()
class OTP {
        async OTPSend(req, res, next) {
                try {
                        let { email } = req.body;

                        const customerdata = await MainDB.getmenual("tblcafe_customerdetails", new _CustomerDetails(), [{ $match: { email: email } }]);

                        if (!customerdata.ResultData.length) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Email not found"
                                };
                                return next();
                        }

                        if (customerdata.ResultData[0].email !== email) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: Config.errmsg['invalidemail']
                                };
                                return next();
                        }

                        const otp = Methods.generateRandomNumber(6);

                        const data = {
                                customerid: new ObjectId(customerdata.ResultData[0]._id),
                                customeemail: email,
                                oldpassword: customerdata.ResultData[0].password,
                                newpassword: "",
                                otp: otp,
                                attempt: 0,
                                isverified: 0,
                                create_at: Methods.getdatetimeisostr(),
                                updated_at: Methods.getdatetimeisostr()
                        };
                        const check = await MainDB.executedata('i', new _OTP(), "tblcafe_forgetpasswords", data)

                        let template = Config.emailtemplates['forgotpassword'];
                        let senddata = {
                                name: customerdata.ResultData[0].name,
                                otp: otp
                        };

                        // Send email
                        await MainDB.sendMail(2, 'lagurudhrapujaday1@gmail.com', [req.body.email], template, '', senddata);
                        if (check.status !== 200) {
                                req.ResponseBody = {
                                        status: 500,
                                        message: "Failed to generate OTP"
                                };
                                return next();
                        }

                        req.ResponseBody = {
                                status: 200,
                                message: "OTP has been sent to your Email"
                        };
                        next();

                } catch (err) {
                        console.error("Error: ", err);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        };
                        next();
                }
        }

        async OTPverify(req, res, next) {
                try {
                        const email = req.body.email;
                        const enteredOtp = req.body.otp;

                        const otpRecords = await MainDB.getmenual("tblcafe_forgetpasswords", new _OTP(), [{ $match: { customeemail: email } },
                        { $sort: { _id: -1 } },
                        { $limit: 1 },
                        ]);

                        if (!otpRecords || otpRecords.length === 0) {
                                req.ResponseBody = {
                                        status: 404,
                                        message: "No OTP found for this customer",
                                };
                                return next();
                        }

                        const otpRecord = otpRecords.ResultData[0];

                        const createdAt = new Date(otpRecord.create_at);
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
                                        status: 429,
                                        message: "Too many attempts. New OTP has been generated.",
                                };
                                return next();
                        }
                        if (enteredOtp == otpRecord.otp) {
                                await MainDB.Update("tblcafe_forgetpasswords", new _OTP(), [{ _id: new ObjectId(otpRecord._id) }, {
                                        isverified: 1,
                                }]);

                                req.ResponseBody = {
                                        status: 200,
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
}

export default OTP