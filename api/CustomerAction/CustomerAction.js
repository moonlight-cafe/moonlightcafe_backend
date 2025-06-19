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
}

export default CustomerAction