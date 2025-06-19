import { Config, Methods, MainDB } from "../../config/Init.js"
import _ContactUs from "../../model/ContactUs.js"

const ObjectId = Methods.getObjectId()
class AddToCart {
        async ListContactUs(req, res, next) {
                try {
                        // const ContactUs = await MainDB.getmenual("tblcafe_contactus", new _ContactUs(), [{ $match: { isactive: req.body.isactive } }])
                        const ContactUs = await MainDB.getmenual("tblcafe_contactus", new _ContactUs(), [{ $match: {} }])
                        req.ResponseBody = {
                                status: 200,
                                message: "Contact Us List",
                                data: ContactUs.ResultData
                        }
                        next()
                } catch (err) {
                        console.error("Error: ", err);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async AddContactUs(req, res, next) {
                try {
                        req.body.create_at = Methods.getdatetimeisostr()
                        req.body.updated_at = Methods.getdatetimeisostr()
                        // if (1) {
                        //         req.ResponseBody = {
                        //                 status: 400,
                        //                 message: "This is red message"
                        //         }
                        //         return next()
                        // }
                        const adddata = await MainDB.executedata("i", new _ContactUs(), "tblcafe_contactus", req.body)

                        req.ResponseBody = {
                                status: adddata.status,
                                message: adddata.status == 200 ? "We will contact you soon!" : adddata.message
                        }
                        next()
                } catch (err) {
                        console.error("Error: ", err);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async UpdateFoodItems(req, res, next) {
                try {

                } catch (error) {
                        console.error(error);
                        req.ResponseBody = { status: 500, message: Config.resstatuscode["500"] }
                        next()
                }
        }
}


export default AddToCart