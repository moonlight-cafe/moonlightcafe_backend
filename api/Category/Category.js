import { Config, Methods, MainDB } from "../../config/Init.js"
import _Categories from "../../model/Category.js"

const ObjectId = Methods.getObjectId()
class AddToCart {
        async ListCategories(req, res, next) {
                try {
                        var PaginationInfo = req.body.paginationinfo;
                        const requiredPage = { pageno: PaginationInfo.pageno, skip: (PaginationInfo.pageno - 1) * PaginationInfo.pagelimit, pagelimit: PaginationInfo.pagelimit };
                        var pipeline = [];
                        var sort = Object.keys(PaginationInfo.sort).length !== 0 ? PaginationInfo.sort : {};
                        pipeline.push(...Methods.GetPipelineForFilter(PaginationInfo.filter));
                        const searchtext = req.body.searchtext || ""
                        let projection = PaginationInfo.projection ? PaginationInfo.projection : {};

                        if (searchtext !== "") {
                                pipeline.push(...Methods.GetGlobalSearchFilter(new _Categories(), searchtext))
                        }

                        const fetchdata = await MainDB.getmenual("tblcafe_category", new _Categories(), pipeline, requiredPage, sort, false, projection)

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

        async UpdateCategory(req, res, next) {
                try {
                        let ResponseBody = {}

                        let checkdata = await MainDB.getmenual('tblcafe_category', new _Categories(), [{ $match: { name: req.body.name, _id: { $ne: new ObjectId(req.body._id) } } }])

                        if (checkdata.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = "Data already Exsist"
                                req.ResponseBody = ResponseBody
                                return next()
                        }
                        let checkid = await MainDB.getmenual('tblcafe_category', new _Categories(), [{ $match: { _id: new ObjectId(req.body._id) } }])

                        if (!checkid.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = Config.errmsg['notexist']
                                req.ResponseBody = ResponseBody
                                return next()
                        }

                        req.body.updated_at = Methods.getdatetimeisostr()
                        const updatedata = await MainDB.Update('tblcafe_category', new _Categories(), [{ _id: new ObjectId(req.body._id) }, req.body])
                        ResponseBody.status = updatedata.status
                        ResponseBody.message = updatedata.status == 200 ? "Category Updated Successfully" : updatedata.message
                        req.ResponseBody = ResponseBody
                        next()
                } catch (error) {
                        console.error(error);
                        req.ResponseBody = { status: 500, message: Config.resstatuscode["500"] }
                        next()
                }
        }

        async RemoveCategory(req, res, next) {
                try {
                        const deletedata = await MainDB.Delete("tblcafe_category", new _Categories(), { _id: new ObjectId(req.body._id) });
                        req.ResponseBody = {
                                status: deletedata.status,
                                message: deletedata.status == 200 ? "Category Deleted Successfully." : deletedata.message
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