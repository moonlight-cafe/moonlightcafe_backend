import { Config, Methods, MainDB } from "../../config/Init.js"
import _MenuModel from "../../model/MenuModel.js"
import _FoodItems from "../../model/FoodItems.js"
import _Permissions from "../../model/Permissions.js"

const ObjectId = Methods.getObjectId()

export default class Menu {
        async InsertMenu(req, res, next) {
                try {
                        let existingData = await MainDB.getmenual('tblcafe_menu', new _MenuModel(), [{ $match: { name: req.body.name } }])


                        if (existingData.ResultData.length) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: `Menu ${req.body.name} is already exists.`
                                }

                                return next()
                        }
                        await MainDB.executedata("i", new _MenuModel(), "tblcafe_menu", req.body);
                        req.ResponseBody = {
                                status: 200,
                                message: "Menu Added successfully"
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

        async ListMenu(req, res, next) {
                try {
                        var PaginationInfo = req.body.paginationinfo;
                        const requiredPage = { pageno: PaginationInfo.pageno, skip: (PaginationInfo.pageno - 1) * PaginationInfo.pagelimit, pagelimit: PaginationInfo.pagelimit };
                        var pipeline = [];
                        var sort = Object.keys(PaginationInfo.sort).length !== 0 ? PaginationInfo.sort : { _id: -1 };
                        pipeline.push(...Methods.GetPipelineForFilter(PaginationInfo.filter));
                        const searchtext = req.body.searchtext || ""
                        let projection = PaginationInfo.projection ? PaginationInfo.projection : {};

                        if (searchtext !== "") {
                                pipeline.push(...Methods.GetGlobalSearchFilter(new _MenuModel(), searchtext))
                        }

                        const fetchdata = await MainDB.getmenual("tblcafe_menu", new _MenuModel(), pipeline, requiredPage, sort, false, projection)

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

        async UpdateMenu(req, res, next) {
                try {
                        let ResponseBody = {}

                        let checkdata = await MainDB.getmenual('tblcafe_menu', new _MenuModel(), [{ $match: { name: req.body.name, _id: { $ne: new ObjectId(req.body._id) } } }])

                        if (checkdata.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = "Data already Exsist"
                                req.ResponseBody = ResponseBody
                                return next()
                        }
                        let checkid = await MainDB.getmenual('tblcafe_menu', new _MenuModel(), [{ $match: { _id: new ObjectId(req.body._id) } }])

                        if (!checkid.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = Config.errmsg['notexist']
                                req.ResponseBody = ResponseBody
                                return next()
                        }
                        req.body.updated_at = Methods.getdatetimeisostr()
                        const updatedata = await MainDB.Update('tblcafe_menu', new _MenuModel(), [{ _id: new ObjectId(req.body._id) }, req.body])
                        ResponseBody.status = updatedata.status
                        ResponseBody.message = updatedata.status == 200 ? "Menu Updated Successfully" : updatedata.message
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

        async RemoveMenu(req, res, next) {
                try {
                        const deletedata = await MainDB.Delete("tblcafe_menu", new _MenuModel(), { _id: new ObjectId(req.body._id) });
                        req.ResponseBody = {
                                status: deletedata.status,
                                message: deletedata.status == 200 ? "Menu Deleted Successfully." : deletedata.message
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

        async AddUpdatePermissions(req, res, next) {
                try {
                        const body = req.body || {}
                        const rawList = Array.isArray(body)
                                ? body
                                : (Array.isArray(body.permissions) ? body.permissions : [body])

                        const roleid = body.roleid || rawList[0]?.roleid
                        const employeeid = body.employeeid || rawList[0]?.employeeid

                        if (!roleid) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "roleid is required"
                                }
                                return next()
                        }

                        const deleteFilter = {
                                roleid: new ObjectId(roleid)
                        }

                        if (employeeid) {
                                deleteFilter.employeeid = new ObjectId(employeeid)
                        }

                        await MainDB.DeleteMany("tblcafe_permissions", new _Permissions(), deleteFilter)

                        const mergeRight = (obj, key) => {
                                if (!obj || typeof obj !== "object") return undefined
                                if (obj[key] !== undefined) return obj[key]
                                const selfKey = `self_${key}`
                                const allKey = `all_${key}`
                                if (obj[selfKey] === undefined && obj[allKey] === undefined) return undefined
                                return Math.max(obj[selfKey] ?? 0, obj[allKey] ?? 0)
                        }

                        const payloadList = rawList.map((item) => {
                                if (!item || typeof item !== "object") return item
                                const patched = { ...item }
                                if (roleid && !patched.roleid) patched.roleid = roleid
                                if (employeeid && !patched.employeeid) patched.employeeid = employeeid

                                const view = mergeRight(patched, "view")
                                const insert = mergeRight(patched, "insert")
                                const update = mergeRight(patched, "update")
                                const del = mergeRight(patched, "delete")

                                if (view !== undefined) patched.view = view
                                if (insert !== undefined) patched.insert = insert
                                if (update !== undefined) patched.update = update
                                if (del !== undefined) patched.delete = del
                                return patched
                        })

                        if (payloadList.length) {
                                await MainDB.InsertMany("tblcafe_permissions", new _Permissions(), payloadList)
                        }

                        req.ResponseBody = {
                                status: 200,
                                message: "Permissions Updated Successfully"
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

        async ListPermissions(req, res, next) {
                try {
                        const roleid = req.body?.roleid
                        const employeeid = req.body?.employeeid

                        if (!roleid && !employeeid) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "roleid or employeeid is required"
                                }
                                return next()
                        }

                        const match = employeeid
                                ? { employeeid: new ObjectId(employeeid) }
                                : { roleid: new ObjectId(roleid) }

                        const fetchdata = await MainDB.getmenual("tblcafe_permissions", new _Permissions(), [{ $match: match }, { $sort: { _id: 1 } }]);
                        let data = fetchdata.ResultData || []

                        if (!data.length) {
                                const menuresp = await MainDB.getmenual("tblcafe_menu", new _MenuModel(), [{ $match: { isactive: 1 } }, { $sort: { displayorder: 1 } }])
                                const menus = menuresp.ResultData || []

                                data = menus.map((menu) => ({
                                        _id: new ObjectId(),
                                        roleid: roleid,
                                        employeeid: employeeid || null,
                                        menu_id: menu._id,
                                        menu_name: menu.name,
                                        menu_alias: menu.redirecturl || menu.name,
                                        view: 0,
                                        insert: 0,
                                        update: 0,
                                        delete: 0,
                                }))
                        }

                        const mergeRight = (obj, key) => {
                                if (!obj || typeof obj !== "object") return undefined
                                if (obj[key] !== undefined) return obj[key]
                                const selfKey = `self_${key}`
                                const allKey = `all_${key}`
                                if (obj[selfKey] === undefined && obj[allKey] === undefined) return undefined
                                return Math.max(obj[selfKey] ?? 0, obj[allKey] ?? 0)
                        }

                        data = data.map((item) => {
                                if (!item || typeof item !== "object") return item
                                const view = mergeRight(item, "view")
                                const insert = mergeRight(item, "insert")
                                const update = mergeRight(item, "update")
                                const del = mergeRight(item, "delete")

                                return {
                                        _id: item._id ?? null,
                                        roleid: item.roleid ?? roleid ?? null,
                                        employeeid: item.employeeid ?? employeeid ?? null,
                                        menu_id: item.menu_id ?? null,
                                        menu_name: item.menu_name ?? "",
                                        menu_alias: item.menu_alias ?? "",
                                        view: view === undefined ? 1 : view,
                                        insert: insert === undefined ? 1 : insert,
                                        update: update === undefined ? 1 : update,
                                        delete: del === undefined ? 1 : del
                                }
                        })
                        req.ResponseBody = {
                                status: 200,
                                message: Config.resstatuscode['200'],
                                data: data
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
