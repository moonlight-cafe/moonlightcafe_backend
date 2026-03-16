import { Config, Methods, MainDB, cloudinary } from "../../config/Init.js";
import _CustomerDetails from "../../model/CustomerDetails/CustomerDetails.js"

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

        async ListCustomer(req, res, next) {
                try {
                        var PaginationInfo = req.body.paginationinfo;
                        const requiredPage = { pageno: PaginationInfo.pageno, skip: (PaginationInfo.pageno - 1) * PaginationInfo.pagelimit, pagelimit: PaginationInfo.pagelimit };
                        var pipeline = [];
                        var sort = Object.keys(PaginationInfo.sort).length !== 0 ? PaginationInfo.sort : {};
                        pipeline.push(...Methods.GetPipelineForFilter(PaginationInfo.filter));
                        const searchtext = req.body.searchtext || ""
                        let projection = PaginationInfo.projection ? PaginationInfo.projection : {};

                        if (searchtext !== "") {
                                pipeline.push(...Methods.GetGlobalSearchFilter(new _CustomerDetails(), searchtext, ["uniqueid", "name", "number", "email"]))
                        }

                        const fetchdata = await MainDB.getmenual("tblcafe_customerdetails", new _CustomerDetails(), pipeline, requiredPage, sort, false, projection)

                        req.ResponseBody = {
                                status: 200,
                                message: Config.resstatuscode['200'],
                                data: fetchdata.ResultData,
                                currentpage: fetchdata.currentpage,
                                nextpage: fetchdata.nextpage,
                                totaldocs: fetchdata.totaldocs
                        };
                        next();

                } catch (err) {
                        console.error("Error: ", err);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async UpdateCustomerDetails(req, res, next) {
                try {
                        const validatedata = Methods.validateEmailAndPhone(req.body.email, req.body.number, req.body._id);
                        if (validatedata.status === 400) {
                                req.ResponseBody = {
                                        status: validatedata.status,
                                        message: validatedata.message
                                };
                                return next();
                        }

                        const checkUser = await MainDB.getmenual("tblcafe_customerdetails", new _CustomerDetails(), [{
                                $match: {
                                        _id: { $ne: new ObjectId(req.body._id) },
                                        $or: [{ number: req.body.number }, { email: req.body.email }]
                                }
                        }]);
                        if(req.body.password) delete req.body.password

                        if (checkUser?.ResultData?.length > 0) {
                                const existing = checkUser.ResultData[0];
                                let errorMessage = "Email or mobile already exists.";
                                if (existing.email === req.body.email && existing.number === req.body.number) {
                                        errorMessage = "Both email and mobile number are already registered.";
                                } else if (existing.email === req.body.email) {
                                        errorMessage = "This email is already registered.";
                                } else if (existing.number === req.body.number) {
                                        errorMessage = "This mobile number is already registered.";
                                }

                                req.ResponseBody = {
                                        status: 400,
                                        message: errorMessage
                                };
                                return next();
                        }

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
                        req.ResponseBody = {
                                status: 500,
                                message: "Internal Server Error"
                        }
                        next()
                }
        }

        async ChangeForgotPassword(req, res, next) {
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

        async PassWordUpdateSecure(req, res, next) {
                try {
                        let ResponseBody = {};


                        if (req.body.oldpassword === req.body.newpassword) {
                                ResponseBody.status = 400;
                                ResponseBody.message = "New password cannot be same as old password.";
                                req.ResponseBody = ResponseBody;
                                return next();
                        }

                        const checkMail = await MainDB.getmenual(
                                "tblcafe_customerdetails",
                                new _CustomerDetails(),
                                [{ $match: { email: req.body.email } }]
                        );


                        if (!checkMail.ResultData.length) {
                                ResponseBody.status = 400;
                                ResponseBody.message = "Email not found.";
                                req.ResponseBody = ResponseBody;
                                return next();
                        }

                        const verifypwd = Methods.validatePassword(req.body.newpassword);
                        if (verifypwd.status !== 200) {
                                console.error("Password validation failed:", verifypwd.message);
                                return res.status(verifypwd.status).json(verifypwd);
                        }

                        const dbUser = checkMail.ResultData[0];
                        const encryptedOldPassword = Methods.decryptPassword(dbUser.password, dbUser.create_at)

                        if (req.body.oldpassword !== encryptedOldPassword) {
                                ResponseBody.status = 400;
                                ResponseBody.message = "Old password is incorrect.";
                                req.ResponseBody = ResponseBody;
                                return next();
                        }
                        const encryptedNewPassword = Methods.encryptPassword(req.body.newpassword, dbUser.create_at);


                        if (dbUser.password === encryptedNewPassword) {
                                ResponseBody.status = 400;
                                ResponseBody.message = "New password cannot be same as old password.";
                                req.ResponseBody = ResponseBody;
                                return next();
                        }

                        const updatepassword = await MainDB.Update(
                                "tblcafe_customerdetails",
                                new _CustomerDetails(),
                                [
                                        { email: req.body.email },
                                        {
                                                password: encryptedNewPassword,
                                                updated_at: Methods.getdatetimeisostr()
                                        }
                                ]
                        );

                        ResponseBody.status = updatepassword.status;
                        ResponseBody.message = updatepassword.status == 200 ? "Password updated successfully." : updatepassword.message;
                        req.ResponseBody = ResponseBody;
                        next();

                } catch (error) {
                        console.error(error);
                        req.ResponseBody = {
                                status: 500,
                                message: "Internal Server Error"
                        };
                        next();
                }
        }

}

export default CustomerAction