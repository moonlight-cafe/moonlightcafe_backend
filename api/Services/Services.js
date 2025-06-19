import { Config, Methods, MainDB } from "../../config/Init.js"
import _Services from "../../model/Services.js"

const ObjectId = Methods.getObjectId()
class AddToCart {
        async ListServices(req, res, next) {
                try {
                        // const Services = await MainDB.getmenual("tblcafe_services", new _Services(), [{ $match: { isactive: req.body.isactive } }])
                        const Services = await MainDB.getmenual("tblcafe_services", new _Services(), [{ $match: {} }])
                        req.ResponseBody = {
                                status: 200,
                                message: "Services List",
                                data: Services.ResultData
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

        async AddServices(req, res, next) {
                try {
                        const existingData = await MainDB.getmenual("tblcafe_services", new _Services(), [{ $match: { name: req.body.name } }]);

                        if (existingData.ResultData.length) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: `Services ${req.body.name} is already exists.`
                                }

                                return next()
                        }

                        let code;
                        let isUnique = false;

                        do {
                                code = Methods.generateRandomNumber(4);

                                const existing = await MainDB.getmenual("tblcafe_services", new _Services(), [{ $match: { code: code } }]);

                                if (!existing.ResultData.length) {
                                        isUnique = true;
                                }
                        } while (!isUnique);

                        req.body.create_at = Methods.getdatetimeisostr()
                        req.body.updated_at = Methods.getdatetimeisostr()
                        req.body.code = code
                        const adddata = await MainDB.executedata("i", new _Services(), "tblcafe_services", req.body)

                        req.ResponseBody = {
                                status: adddata.status,
                                message: adddata.status == 200 ? "Services Inserted" : adddata.message
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