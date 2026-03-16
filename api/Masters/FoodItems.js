import { Config, Methods, MainDB } from "../../config/Init.js"
import _Categories from "../../model/Category.js"
import _FoodItems from "../../model/FoodItems.js"

const ObjectId = Methods.getObjectId()
class AddToCart {
        async ListFoodItems(req, res, next) {
                try {
                        // await new Promise(resolve => setTimeout(resolve, 5000));
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

        async ListFoodItemsWithFilters(req, res, next) {
                try {
                        var PaginationInfo = req.body.paginationinfo;
                        const requiredPage = { pageno: PaginationInfo.pageno, skip: (PaginationInfo.pageno - 1) * PaginationInfo.pagelimit, pagelimit: PaginationInfo.pagelimit };
                        var pipeline = [];
                        var sort = Object.keys(PaginationInfo.sort).length !== 0 ? PaginationInfo.sort : {};
                        pipeline.push(...Methods.GetPipelineForFilter(PaginationInfo.filter));
                        const searchtext = req.body.searchtext || ""
                        let projection = PaginationInfo.projection ? PaginationInfo.projection : {};

                        if (searchtext !== "") {
                                pipeline.push(...Methods.GetGlobalSearchFilter(new _FoodItems(), searchtext))
                        }

                        const fetchdata = await MainDB.getmenual("tblcafe_fooditems", new _FoodItems(), pipeline, requiredPage, sort, false, projection)
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

        async AddFoodItems(req, res, next) {
                try {
                        const requiredFields = [
                                "name",
                                "category",
                                "categorycode",
                                // "description",
                                "price",
                                // "url"
                        ];

                        const uploadimg = await Methods.fileupload(req.body.file, "fooditems", req.body.name, "jpg")

                        req.body.url = uploadimg.url

                        const missingFields = requiredFields.filter(
                                field => !req.body[field] || req.body[field].toString().trim() === ""
                        );

                        if (missingFields.length > 0) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: `Missing required fields: ${missingFields.join(", ")}`
                                };
                                return next();
                        }

                        // 🔹 Price validation
                        if (isNaN(req.body.price) || Number(req.body.price) <= 0) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Price must be a valid positive number"
                                };
                                return next();
                        }

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
                        let ResponseBody = {}

                        let checkdata = await MainDB.getmenual('tblcafe_fooditems', new _FoodItems(), [{ $match: { name: parseInt(req.body.name), _id: { $ne: new ObjectId(req.body._id) } } }])

                        if (checkdata.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = "Data already Exsist"
                                req.ResponseBody = ResponseBody
                                return next()
                        }
                        let checkid = await MainDB.getmenual('tblcafe_fooditems', new _FoodItems(), [{ $match: { _id: new ObjectId(req.body._id) } }])

                        if (!checkid.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = Config.errmsg['notexist']
                                req.ResponseBody = ResponseBody
                                return next()
                        }

                        req.body.updated_at = Methods.getdatetimeisostr()
                        const updatedata = await MainDB.Update('tblcafe_fooditems', new _FoodItems(), [{ _id: new ObjectId(req.body._id) }, req.body])
                        ResponseBody.status = updatedata.status
                        ResponseBody.message = updatedata.status == 200 ? "Food Item Updated Successfully" : updatedata.message
                        req.ResponseBody = ResponseBody
                        next()
                } catch (error) {
                        console.error(error);
                        req.ResponseBody = { status: 500, message: Config.resstatuscode["500"] }
                        next()
                }
        }

        async RemoveFoodItems(req, res, next) {
                try {
                        const deletedata = await MainDB.Delete("tblcafe_fooditems", new _FoodItems(), { _id: new ObjectId(req.body._id) });
                        req.ResponseBody = {
                                status: deletedata.status,
                                message: deletedata.status == 200 ? "Food Item Deleted Successfully." : deletedata.message
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
}


export default AddToCart