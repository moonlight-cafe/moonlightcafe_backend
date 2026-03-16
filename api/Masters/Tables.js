import { Config, Methods, MainDB } from "../../config/Init.js"
import _Tables from "../../model/Tables.js"
import _TakeAway from "../../model/TakeAway.js"
import _CustomerData from '../../model/CustomerDetails/CustomerDetails.js'

const ObjectId = Methods.getObjectId()
class Table {
        async FreeTables(req, res, next) {
                try {
                        // const FoodItems = await MainDB.getmenual("tblcafe_tables", new _Tables(), [{ $match: { isavailable: 1, iscleaned: 1 } }, { $sort: { number: 1 } }])
                        const FoodItems = await MainDB.getmenual("tblcafe_tables", new _Tables(), [{ $match: {} }, { $sort: { number: 1 } }])
                        req.ResponseBody = {
                                status: 200,
                                message: "Table List",
                                data: FoodItems.ResultData
                        }
                        next()
                } catch (error) {
                        console.error("Error: ", err);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async AddTables(req, res, next) {
                try {
                        const existingData = await MainDB.getmenual("tblcafe_tables", new _Tables(), [{ $match: { number: parseInt(req.body.number) } }]);

                        if (existingData.ResultData.length) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: `Table ${req.body.number} is already exists.`
                                }

                                return next()
                        }

                        const adddata = await MainDB.executedata("i", new _Tables(), "tblcafe_tables", req.body)

                        req.ResponseBody = {
                                status: adddata.status,
                                message: adddata.status == 200 ? "Table Inserted" : adddata.message
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

        async BookTable(req, res, next) {
                try {
                        let ResponseBody = {}

                        const checkavailabletbl = await MainDB.getmenual("tblcafe_tables", new _Tables(), [{ $match: { _id: new ObjectId(req.body._id), isavailable: 1 } }])
                        if (!checkavailabletbl.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = "Table is already Booked !"
                                req.ResponseBody = ResponseBody
                                return next()
                        }
                        const busytable = await MainDB.Update("tblcafe_tables", new _Tables(), [{ _id: new ObjectId(req.body._id) }, { isavailable: 0, usedby: new ObjectId(req.body.customerid), usedbyname: req.body.customername }])

                        await MainDB.Update('tblcafe_customerdetails', new _CustomerData(), [{ _id: new ObjectId(req.body.customerid) }, { tblno: req.body.tableno }])
                        ResponseBody.status = busytable.status
                        ResponseBody.message = busytable.message
                        req.ResponseBody = ResponseBody
                        next()
                } catch (error) {
                        console.error("Error: ", err);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async RemoveTables(req, res, next) {
                try {
                        const deletedata = await MainDB.Delete("tblcafe_tables", new _Tables(), { _id: new ObjectId(req.body._id) });
                        req.ResponseBody = {
                                status: deletedata.status,
                                message: deletedata.status == 200 ? "Table Deleted Successfully." : deletedata.message
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

        async ListTables(req, res, next) {
                try {
                        var PaginationInfo = req.body.paginationinfo;
                        const requiredPage = { pageno: PaginationInfo.pageno, skip: (PaginationInfo.pageno - 1) * PaginationInfo.pagelimit, pagelimit: PaginationInfo.pagelimit };
                        var pipeline = [];
                        var sort = Object.keys(PaginationInfo.sort).length !== 0 ? PaginationInfo.sort : {};
                        pipeline.push(...Methods.GetPipelineForFilter(PaginationInfo.filter));
                        const searchtext = req.body.searchtext || ""
                        let projection = PaginationInfo.projection ? PaginationInfo.projection : {};

                        if (searchtext !== "") {
                                pipeline.push(...Methods.GetGlobalSearchFilter(new _Tables(), searchtext, ["number"]))
                        }

                        const fetchdata = await MainDB.getmenual("tblcafe_tables", new _Tables(), pipeline, requiredPage, sort, false, projection)

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

        async UpdateTable(req, res, next) {
                try {
                        let ResponseBody = {}

                        let checkdata = await MainDB.getmenual('tblcafe_tables', new _Tables(), [{ $match: { number: parseInt(req.body.number), _id: { $ne: new ObjectId(req.body._id) } } }])

                        if (checkdata.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = "Data already Exsist"
                                req.ResponseBody = ResponseBody
                                return next()
                        }
                        let checkid = await MainDB.getmenual('tblcafe_tables', new _Tables(), [{ $match: { _id: new ObjectId(req.body._id) } }])

                        if (!checkid.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = Config.errmsg['notexist']
                                req.ResponseBody = ResponseBody
                                return next()
                        }
                        req.body.updated_at = Methods.getdatetimeisostr()
                        const updatedata = await MainDB.Update('tblcafe_tables', new _Tables(), [{ _id: new ObjectId(req.body._id) }, req.body])
                        ResponseBody.status = updatedata.status
                        ResponseBody.message = updatedata.status == 200 ? "Table Updated Successfully" : updatedata.message
                        req.ResponseBody = ResponseBody
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

        async TakeAwayURL(req, res, next) {
                try {
                        let ResponseBody = {}

                        let redirecturl;
                        let isRedirectUrlUnique = false;
                        while (!isRedirectUrlUnique) {
                                redirecturl = Methods.generateRandomString(18);
                                const existingUrl = await MainDB.getmenual("tblcafe_takeaway", new _TakeAway(), [{ $match: { redirecturl: redirecturl } }]
                                );
                                if (existingUrl.ResultData.length === 0) {
                                        isRedirectUrlUnique = true;
                                }
                        }

                        let billno;
                        let isBillNoUnique = false;
                        while (!isBillNoUnique) {
                                billno = Methods.generateRandomNumber(12);
                                const existingBill = await MainDB.getmenual("tblcafe_takeaway", new _TakeAway(), [{ $match: { billno: billno } }]
                                );
                                if (existingBill.ResultData.length === 0) {
                                        isBillNoUnique = true;
                                }
                        }


                        const adddata = await MainDB.executedata("i", new _TakeAway(), "tblcafe_takeaway", {
                                redirecturl: redirecturl,
                                customerid: req.body._id,
                                customername: req.body.name,
                                customeremail: req.body.email,
                                customercontact: req.body.contact,
                                created_at: Methods.getdatetimeisostr(),
                                updated_at: Methods.getdatetimestr(),
                                billno: billno,
                        })

                        ResponseBody.status = 200
                        ResponseBody.message = "Takeaway"
                        ResponseBody.redirecturl = redirecturl
                        req.ResponseBody = ResponseBody
                        next()

                } catch (error) {
                        console.error("Error: ", err);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }
}

export default Table