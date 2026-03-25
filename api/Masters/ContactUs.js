import { Config, Methods, MainDB } from "../../config/Init.js"
import _ContactUs from "../../model/ContactUs.js"

const ObjectId = Methods.getObjectId()
class AddToCart {
        async ListContactUs(req, res, next) {
                try {
                        var PaginationInfo = req.body.paginationinfo;
                        const requiredPage = { pageno: PaginationInfo.pageno, skip: (PaginationInfo.pageno - 1) * PaginationInfo.pagelimit, pagelimit: PaginationInfo.pagelimit };
                        var pipeline = [];
                        var sort = Object.keys(PaginationInfo.sort).length !== 0 ? PaginationInfo.sort : { _id: -1 };
                        pipeline.push(...Methods.GetPipelineForFilter(PaginationInfo.filter));
                        const searchtext = req.body.searchtext || ""
                        let projection = PaginationInfo.projection ? PaginationInfo.projection : {};

                        if (searchtext !== "") {
                                pipeline.push(...Methods.GetGlobalSearchFilter(new _ContactUs(), searchtext))
                        }

                        const fetchdata = await MainDB.getmenual("tblcafe_contactus", new _ContactUs(), pipeline, requiredPage, sort, false, projection)
                        req.ResponseBody = {
                                status: 200,
                                message: "Contact Us List",
                                data: fetchdata.ResultData,
                                nextpage: fetchdata.nextpage,
                                currentpage: fetchdata.currentpage,
                                totaldocs: fetchdata.totaldocs,
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
                        req.body.tickitid = "TKT0000001";

                        const lastcustomerdata = await MainDB.getmenual("tblcafe_contactus", new _ContactUs(), [{ $match: {} }, { $project: { tickitid: 1 } }, { $sort: { _id: -1 } }, { $limit: 1 }])

                        if (lastcustomerdata.ResultData.length > 0 && lastcustomerdata.ResultData[0].tickitid) {
                                const lastNum = parseInt(lastcustomerdata.ResultData[0].tickitid.replace("TKT", ""));
                                const nextNum = lastNum + 1;
                                req.body.tickitid = "TKT" + nextNum.toString().padStart(7, '0');
                        }
                        const adddata = await MainDB.executedata("i", new _ContactUs(), "tblcafe_contactus", req.body)

                        let template = Config.emailtemplates['customersupport'];
                        let senddata = {
                                ticketId: adddata.data.tickitid,
                                name: adddata.data.name,
                                message: adddata.data.message,
                                createdAt: Methods.formatDateToCustom(adddata.data.createdAt)
                        };
                        await MainDB.sendMail('', [req.body.email], template, '', senddata);

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

        async ResolveContactUs(req, res, next) {
                try {
                        let ResponseBody = {}
                        const verifydata = await MainDB.getmenual("tblcafe_contactus", new _ContactUs(), [{ $match: { _id: new ObjectId(req.body._id) } }])
                        if (!verifydata.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = Config.errmsg['notexist']
                                req.ResponseBody = ResponseBody
                                return next()
                        }
                        req.body.updated_at = Methods.getdatetimeisostr()
                        const updatedata = await MainDB.Update('tblcafe_contactus', new _ContactUs(), [{ _id: new ObjectId(req.body._id) }, req.body])

                        let template = Config.emailtemplates['customersupportresolved'];
                        let senddata = {
                                tickitid: verifydata.ResultData[0].tickitid,
                                name: verifydata.ResultData[0].name,
                                remark: req.body.remark,
                                resolvedAt: Methods.formatDateToCustom(req.body.updated_at)
                        };
                        await MainDB.sendMail('', [verifydata.ResultData[0].email], template, '', senddata);

                        ResponseBody.status = updatedata.status
                        ResponseBody.message = updatedata.status == 200 ? "Tickit Resolved" : updatedata.message
                        req.ResponseBody = ResponseBody
                        next()
                } catch (error) {
                        console.error(error);
                        req.ResponseBody = { status: 500, message: Config.resstatuscode["500"] }
                        next()
                }
        }
}


export default AddToCart