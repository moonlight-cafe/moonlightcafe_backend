import { Config, Methods, MainDB, cloudinary } from "../../config/Init.js";
import _CustomerDetails from "../../CustomerDetails/CustomerDetails.js"

const ObjectId = Methods.getObjectId();

class CustomerAction {
        async ListCustomerDetails(req, res, next) {
                try {
                        const customerdata = await MainDB.getmenual("tblcafe_customerdetails", new _CustomerDetails(), [{ $match: { _id: new ObjectId(req.body._id) } }]);
                        if (!customerdata.ResultData.length) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: Config.errmsg['customernotfound']
                                };
                                return next();
                        }
                        req.ResponseBody = {
                                status: 200,
                                message: "Customer Details Fetched",
                                data: customerdata.ResultData
                        }
                        next()
                } catch (error) {

                }
        }

        async UpdateCustomerDetails(req, res, next) {
                try {
                        const updated = await MainDB.Update("tblcafe_customerdetails", new _CustomerDetails(), [{ _id: new ObjectId(req.body._id) }, {
                                name: req.body.name,
                                email: req.body.email,
                                number: req.body.number,
                        }])

                        req.ResponseBody = {
                                status: updated.status,
                                message: updated.status == 200 ? "Profile Updated Successfully." : updated.message
                        }
                        next()

                } catch (error) {
                        console.error(error);
                }
        }

        async PassWordUpdateSecure(req, res, next) {
                console.log("🚀 ~ CustomerAction.js:48 ~ CustomerAction ~ PassWordUpdateSecure ~ req>>", req.bode);

                try {
                        let ResponseBody = {}

                        if (req.body.password !== req.body.cnfpassword) {
                                ResponseBody.status = 400
                                ResponseBody.message = "Password and Confirm Password does not Match!"
                                req.ResponseBody = ResponseBody
                                return next()
                        }

                        const checkMail = await MainDB.getmenual("tblcafe_customerdetails", new _CustomerDetails(), [{ $match: { email: req.body.email } }])

                        if (!checkMail.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = "Email Not Found"
                                req.ResponseBody = ResponseBody
                                return next()
                        }

                        const password = Methods.encryptPassword(req.body.password, checkMail.ResultData[0].create_at);
                        console.log("🚀 ~ CustomerAction.js:70 ~ CustomerAction ~ PassWordUpdateSecure ~ password>>", password);
                        console.log("🚀 ~ CustomerAction.js:73 ~ CustomerAction ~ PassWordUpdateSecure ~ checkMail.ResultData[0].password>>", checkMail.ResultData[0].password);

                        if (checkMail.ResultData[0].password == password) {

                                ResponseBody.status = 400
                                ResponseBody.message = "New password cannot be same as old password."
                                req.ResponseBody = ResponseBody
                                return next()
                        }


                        const updatepassword = await MainDB.Update("tblcafe_customerdetails", new _CustomerDetails(), [{ email: req.body.email }, { password: password, updated_at: Methods.getdatetimeisostr() }])

                        ResponseBody.status = updatepassword.status
                        ResponseBody.message = updatepassword.status == 200 ? "Password Update Successfully." : updatepassword.message
                        req.ResponseBody = ResponseBody
                        next()

                } catch (error) {
                        console.error(error);
                        req.ResponseBody = {
                                status: 500,
                                message: "Internal Server Error"
                        }
                        next()
                }
        }
}

export default CustomerAction