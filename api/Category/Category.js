import { Config, Methods, MainDB } from "../../config/Init.js"
import _Categories from "../../model/Category.js"

const ObjectId = Methods.getObjectId()
class AddToCart {
        async ListCategories(req, res, next) {
                try {
                        const Categories = await MainDB.getmenual("tblcafe_category", new _Categories(), [{ $match: { isactive: req.body.isactive } }])
                        req.ResponseBody = {
                                status: 200,
                                message: "Category List",
                                data: Categories.ResultData
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

        async AddCategories(req, res, next) {
                try {
                        const existingData = await MainDB.getmenual("tblcafe_category", new _Categories(), [{ $match: { name: req.body.name } }]);

                        if (existingData.ResultData.length) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: `Category ${req.body.name} is already exists.`
                                }
                                return next()
                        }

                        let code;
                        let isUnique = false;

                        do {
                                code = Methods.generateRandomNumber(6);

                                const existing = await MainDB.getmenual("tblcafe_category", new _Categories(), [{ $match: { code: code } }]);

                                if (!existing.ResultData.length) {
                                        isUnique = true;
                                }
                        } while (!isUnique);

                        req.body.create_at = Methods.getdatetimeisostr()
                        req.body.updated_at = Methods.getdatetimeisostr()
                        req.body.code = code
                        const adddata = await MainDB.executedata("i", new _Categories(), "tblcafe_category", req.body)

                        req.ResponseBody = {
                                status: adddata.status,
                                message: adddata.status == 200 ? "Category Inserted" : adddata.message
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

        async UpdateCategories(req, res, next) {
                try {
                        await MainDB.Update("tblcafe_category", new _Categories(), [{ code: req.body.code }, { isactive: req.body.status }])

                        req.ResponseBody = {
                                status: 200,
                                message: "Status Updated!"
                        }
                        next()
                } catch (error) {
                        console.error(error);
                        req.ResponseBody = { status: 500, message: Config.resstatuscode["500"] }
                        next()
                }
        }
}


export default AddToCart