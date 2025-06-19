import { Config, Methods, MainDB } from "../../config/Init.js"
import _FoodItems from "../../model/FoodItems.js"

const ObjectId = Methods.getObjectId()
class AddToCart {
        async ListFoodItems(req, res, next) {
                try {
                        const FoodItems = await MainDB.getmenual("tblcafe_fooditems", new _FoodItems(), [{ $match: { isactive: req.body.isactive } }])
                        req.ResponseBody = {
                                status: 200,
                                message: "Food Item List",
                                data: FoodItems.ResultData
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

        async AddFoodItems(req, res, next) {
                try {
                        const existingData = await MainDB.getmenual("tblcafe_fooditems", new _FoodItems(), [{ $match: { name: req.body.name } }]);

                        if (existingData.ResultData.length) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: `Food Item ${req.body.name} is already exists.`
                                }

                                return next()
                        }

                        let code;
                        let isUnique = false;

                        do {
                                code = Methods.generateRandomNumber(6);

                                const existing = await MainDB.getmenual("tblcafe_fooditems", new _FoodItems(), [{ $match: { code: code } }]);

                                if (!existing.ResultData.length) {
                                        isUnique = true;
                                }
                        } while (!isUnique);

                        req.body.create_at = Methods.getdatetimeisostr()
                        req.body.updated_at = Methods.getdatetimeisostr()
                        req.body.code = code
                        const adddata = await MainDB.executedata("i", new _FoodItems(), "tblcafe_fooditems", req.body)

                        req.ResponseBody = {
                                status: adddata.status,
                                message: adddata.status == 200 ? "Food Item Inserted" : adddata.message
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