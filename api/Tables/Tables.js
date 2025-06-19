import { Config, Methods, MainDB } from "../../config/Init.js"
import _Tables from "../../model/Tables.js"
import _TakeAway from "../../model/TakeAway.js"

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
                        const existingData = await MainDB.getmenual("tblcafe_tables", new _Tables(), [{ $match: { number: req.body.number } }]);

                        if (existingData.ResultData.length) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: `Table ${req.body.number} is already exists.`
                                }

                                return next()
                        }

                        let url;
                        let isUnique = false;

                        do {
                                url = Methods.generateRandomString(20);

                                const existing = await MainDB.getmenual("tblcafe_tables", new _Tables(), [{ $match: { url: url } }]);

                                if (!existing.ResultData.length) {
                                        isUnique = true;
                                }
                        } while (!isUnique);

                        req.body.create_at = Methods.getdatetimeisostr()
                        req.body.updated_at = Methods.getdatetimeisostr()
                        req.body.url = url
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
                        const busytable = await MainDB.Update("tblcafe_tables", new _Tables(), [{ _id: new ObjectId(req.body._id) }, { isavailable: 0 }])
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