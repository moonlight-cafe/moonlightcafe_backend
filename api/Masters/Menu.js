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
                        } else {
                                deleteFilter.$or = [{ employeeid: null }, { employeeid: { $exists: false } }]
                        }

                        await MainDB.DeleteMany("tblcafe_permissions", new _Permissions(), deleteFilter)

                        const payloadList = rawList.map((item) => {
                                if (!item || typeof item !== "object") return null
                                const view = item.view === 1 || item.view === true ? 1 : 0
                                const insert = view === 1 && (item.insert === 1 || item.insert === true) ? 1 : 0
                                const update = view === 1 && (item.update === 1 || item.update === true) ? 1 : 0
                                const del = view === 1 && (item.delete === 1 || item.delete === true) ? 1 : 0

                                return {
                                        roleid: new ObjectId(roleid),
                                        employeeid: employeeid ? new ObjectId(employeeid) : null,
                                        menu_id: item.menu_id ? new ObjectId(item.menu_id) : new ObjectId(),
                                        menu_name: item.menu_name || "",
                                        menu_alias: item.menu_alias || "",
                                        view: view,
                                        insert: insert,
                                        update: update,
                                        delete: del,
                                        status: 1
                                }
                        }).filter(Boolean)

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

                        // Always fetch all active menus from tblcafe_menu
                        const menuresp = await MainDB.getmenual("tblcafe_menu", new _MenuModel(), [
                                { $match: { isactive: 1 } },
                                { $sort: { displayorder: 1, _id: 1 } }
                        ])
                        const menus = menuresp.ResultData || []

                        // Fetch employee-specific permissions if employeeid is passed
                        let permRecords = []
                        if (employeeid) {
                                const empPermResp = await MainDB.getmenual("tblcafe_permissions", new _Permissions(), [
                                        { $match: { employeeid: new ObjectId(employeeid) } },
                                        { $sort: { _id: 1 } }
                                ])
                                permRecords = empPermResp.ResultData || []
                        }

                        // If no employee-specific permissions found (or only roleid passed), fetch role permissions
                        if (!permRecords.length && roleid) {
                                const rolePermResp = await MainDB.getmenual("tblcafe_permissions", new _Permissions(), [
                                        { $match: { roleid: new ObjectId(roleid), $or: [{ employeeid: null }, { employeeid: { $exists: false } }] } },
                                        { $sort: { _id: 1 } }
                                ])
                                permRecords = rolePermResp.ResultData || []
                        }

                        const permMap = {}
                        permRecords.forEach((p) => {
                                if (p.menu_id) permMap[p.menu_id.toString()] = p
                                if (p.menu_alias) permMap[p.menu_alias.toLowerCase()] = p
                                if (p.menu_name) permMap[p.menu_name.toLowerCase()] = p
                        })

                        const data = menus.map((menu) => {
                                const matched = permMap[menu._id.toString()] ||
                                                (menu.redirecturl && permMap[menu.redirecturl.toLowerCase()]) ||
                                                permMap[menu.name.toLowerCase()]

                                let view = matched ? (matched.view ? 1 : 0) : (permRecords.length === 0 && menu.defaultpermission === 1 ? 1 : 0)
                                let insert = matched ? (matched.insert ? 1 : 0) : (permRecords.length === 0 && menu.defaultpermission === 1 ? 1 : 0)
                                let update = matched ? (matched.update ? 1 : 0) : (permRecords.length === 0 && menu.defaultpermission === 1 ? 1 : 0)
                                let del = matched ? (matched.delete ? 1 : 0) : (permRecords.length === 0 && menu.defaultpermission === 1 ? 1 : 0)

                                if (view === 0) {
                                        insert = 0
                                        update = 0
                                        del = 0
                                }

                                return {
                                        _id: matched?._id || new ObjectId(),
                                        roleid: roleid ? new ObjectId(roleid) : (matched?.roleid ?? null),
                                        employeeid: employeeid ? new ObjectId(employeeid) : null,
                                        menu_id: menu._id,
                                        menu_name: menu.name,
                                        menu_alias: menu.redirecturl || menu.name,
                                        icon: menu.icon || "",
                                        displayorder: menu.displayorder || 0,
                                        view: view,
                                        insert: insert,
                                        update: update,
                                        delete: del
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
