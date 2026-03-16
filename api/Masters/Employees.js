import { Config, Methods, MainDB } from "../../config/Init.js"
import _Employees from "../../model/Employees.js"
import _UserRoles from "../../model/Userroles.js"
import _OTP from "../../model/ForgetPassword.js"
import _Notification from "../../model/Notification.js"

const ObjectId = Methods.getObjectId()

export default class Employees {

        async AddEmployees(req, res, next) {
                try {
                        let ResponseBody = {}
                        const { fname, lname, number, email, role, roleid } = req.body;

                        if (
                                !fname || fname.trim() === "" ||
                                !lname || lname.trim() === "" ||
                                !number || number.trim() === "" ||
                                !email || email.trim() === "" ||
                                !role || role.trim() === "" ||
                                !roleid ||
                                Methods.validateEmailAndPhone(email, number).status !== 200
                        ) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Required fields are missing or invalid"
                                };
                                return next();
                        }

                        const chkemp = await MainDB.CheckEmpExsist(req.body)

                        if (chkemp.status != 200) {
                                ResponseBody.status = chkemp.status
                                ResponseBody.message = chkemp.message
                                req.ResponseBody = ResponseBody
                                return next()
                        }
                        let employeeid;
                        let isUnique = false;
                        do {
                                employeeid = Methods.generateRandomNumber(6);

                                const existing = await MainDB.getmenual("tblcafe_employees", new _Employees(), [{ $match: { employeeid: employeeid } }]);

                                if (!existing.ResultData.length) {
                                        isUnique = true;
                                }
                        } while (!isUnique);
                        req.body.employeeid = employeeid
                        req.body.name = req.body.fname + " " + req.body.lname
                        const password = req.body.fname + "@" + req.body.number.split('').reverse().join('').slice(0, 5) + "#";
                        const create_at = Methods.getdatetimeisostr()
                        const sendata = {
                                name: req.body.name,
                                employeeid: employeeid,
                                role: req.body.role
                        }
                        req.body.password = Methods.encryptPassword(password, create_at)
                        req.body.create_at = create_at
                        req.body.roleid = new ObjectId(req.body?.roleid)

                        const adddata = await MainDB.executedata('i', 'tblcafe_employees', new _Employees(), req.body)

                        let template = Config.emailtemplates['employeereg'];
                        await MainDB.sendMail("", [req.body.email], template, "", sendata)

                        ResponseBody.status = adddata.status
                        ResponseBody.message = adddata.status == 200 ? "Employee Successfully Stored." : adddata.message

                        req.ResponseBody = ResponseBody
                        next()
                } catch (error) {
                        console.error("Error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"]
                        };
                        return next();
                }
        }

        async UpdateEmployees(req, res, next) {
                try {
                        let ResponseBody = {};

                        const { _id, fname, lname, number, email, role, roleid } = req.body;

                        // 1️⃣ Required field validation
                        const validation = Methods.validateEmailAndPhone(email, number);

                        if (
                                !_id ||
                                !fname?.trim() ||
                                !lname?.trim() ||
                                !number?.trim() ||
                                !email?.trim() ||
                                !role?.trim() ||
                                !roleid ||
                                validation.status !== 200
                        ) {
                                req.ResponseBody = {
                                        status: validation.status || 400,
                                        message: validation.message || "Required fields are missing or invalid"
                                };
                                return next();
                        }

                        const chkempemail = await MainDB.CheckEmpExsist(req.body)

                        if (chkempemail.status != 200) {
                                ResponseBody.status = chkempemail.status
                                ResponseBody.message = chkempemail.message
                                req.ResponseBody = ResponseBody
                                return next()
                        }

                        // 2️⃣ Check employee exists
                        const chkemp = await MainDB.getmenual("tblcafe_employees", new _Employees(), [{ $match: { _id: new ObjectId(_id) } }]);

                        if (!chkemp.ResultData.length) {
                                req.ResponseBody = {
                                        status: 404,
                                        message: "Employee not found"
                                };
                                return next();
                        }

                        // 3️⃣ Prepare update object
                        const updateData = {
                                _id: new ObjectId(_id),
                                fname: fname.trim(),
                                lname: lname.trim(),
                                name: `${fname.trim()} ${lname.trim()}`,
                                number: number.trim(),
                                email: email.trim(),
                                role: role.trim(),
                                roleid: new ObjectId(roleid)
                        };

                        // 4️⃣ Update employee
                        const updatedata = await MainDB.executedata('u', 'tblcafe_employees', new _Employees(), updateData);

                        ResponseBody.status = updatedata.status;
                        ResponseBody.message =
                                updatedata.status === 200
                                        ? "Employee Successfully Updated."
                                        : updatedata.message;

                        req.ResponseBody = ResponseBody;
                        return next();

                } catch (error) {
                        console.error("Error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"]
                        };
                        return next();
                }
        }

        async ListEmployee(req, res, next) {
                try {
                        var PaginationInfo = req.body.paginationinfo;
                        const requiredPage = { pageno: PaginationInfo.pageno, skip: (PaginationInfo.pageno - 1) * PaginationInfo.pagelimit, pagelimit: PaginationInfo.pagelimit };
                        var pipeline = [];
                        var sort = Object.keys(PaginationInfo.sort).length !== 0 ? PaginationInfo.sort : { _id: -1 };
                        pipeline.push(...Methods.GetPipelineForFilter(PaginationInfo.filter));
                        const searchtext = req.body.searchtext || ""
                        let projection = PaginationInfo.projection ? PaginationInfo.projection : {};

                        if (searchtext !== "") {
                                pipeline.push(...Methods.GetGlobalSearchFilter(new _Employees(), searchtext))
                        }

                        pipeline.push({
                                $project: {
                                        password: 0,
                                        create_at: 0,
                                        failedLoginAttempts: 0,
                                        lockUntil: 0,
                                        twoFactorSecret: 0,
                                        twoFactorTempToken: 0,
                                        twoFactorTempTokenExpiry: 0
                                }
                        })

                        const fetchdata = await MainDB.getmenual("tblcafe_employees", new _Employees(), pipeline, requiredPage, sort, false, projection)

                        req.ResponseBody = {
                                status: 200,
                                message: Config.resstatuscode['200'],
                                data: fetchdata.ResultData,
                                currentpage: fetchdata.currentpage,
                                nextpage: fetchdata.nextpage,
                                totaldocs: fetchdata.totaldocs
                        };
                        next();
                } catch (error) {
                        console.error("Error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"]
                        };
                        return next();
                }
        }

        async UpdateProfile(req, res, next) {
                try {
                        let ResponseBody = {};

                        const { _id, fname, lname } = req.body;

                        // 1️⃣ Basic validation
                        if (
                                !_id ||
                                !fname?.trim() ||
                                !lname?.trim()
                        ) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "First name and last name are required"
                                };
                                return next();
                        }

                        // 2️⃣ Check employee exists
                        const chkemp = await MainDB.getmenual(
                                "tblcafe_employees",
                                new _Employees(),
                                [{ $match: { _id: new ObjectId(_id) } }]
                        );

                        if (!chkemp.ResultData.length) {
                                req.ResponseBody = {
                                        status: 404,
                                        message: "Employee not found"
                                };
                                return next();
                        }

                        // 3️⃣ Prepare update data
                        const updateData = {
                                _id: new ObjectId(_id),
                                fname: fname.trim(),
                                lname: lname.trim(),
                                name: `${fname.trim()} ${lname.trim()}`,
                        };

                        // 4️⃣ Update profile
                        const updatedata = await MainDB.executedata(
                                'u',
                                'tblcafe_employees',
                                new _Employees(),
                                updateData
                        );

                        ResponseBody.status = updatedata.status;
                        ResponseBody.message =
                                updatedata.status === 200
                                        ? "Profile updated successfully"
                                        : updatedata.message;

                        req.ResponseBody = ResponseBody;
                        return next();

                } catch (error) {
                        console.error("UpdateProfile Error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"]
                        };
                        return next();
                }
        }


        async EmpChangeForgotPassword(req, res, next) {
                try {
                        let ResponseBody = {};

                        const { email, password, cnfpassword, token } = req.body;

                        /* ---------------- Required Fields ---------------- */
                        if (!email || !password || !cnfpassword || !token) {
                                ResponseBody.status = 400;
                                ResponseBody.message = "Required fields missing";
                                req.ResponseBody = ResponseBody;
                                return next();
                        }

                        /* ---------------- Employee Check ---------------- */
                        const empdetails = await MainDB.getmenual(
                                "tblcafe_employees",
                                new _Employees(),
                                [{ $match: { email } }]
                        );

                        if (!empdetails.ResultData.length) {
                                ResponseBody.status = 400;
                                ResponseBody.message = "Email not found";
                                req.ResponseBody = ResponseBody;
                                return next();
                        }

                        const employee = empdetails.ResultData[0];

                        /* ---------------- Confirm Password ---------------- */
                        if (password !== cnfpassword) {
                                ResponseBody.status = 400;
                                ResponseBody.message = "Password and Confirm Password must match";
                                req.ResponseBody = ResponseBody;
                                return next();
                        }

                        /* ---------------- Password Validation ---------------- */
                        const verifypwd = Methods.validatePassword(password);
                        if (verifypwd.status !== 200) {
                                ResponseBody.status = verifypwd.status;
                                ResponseBody.message = verifypwd.message;
                                req.ResponseBody = ResponseBody;
                                return next();
                        }

                        /* ---------------- Old Password Check ---------------- */
                        const oldPassword = Methods.decryptPassword(employee.password, employee.create_at);

                        if (password === oldPassword) {
                                ResponseBody.status = 400;
                                ResponseBody.message = "New password cannot be same as old password";
                                req.ResponseBody = ResponseBody;
                                return next();
                        }

                        /* ---------------- Token Validation (IMPORTANT) ---------------- */
                        const otpTokenRecords = await MainDB.getmenual("tblcafe_forgetpasswords", new _OTP(), [{ $match: { customeremail: req.body.email, isverified: 1, verifiedtoken: 1 } }, { $sort: { _id: -1 } }, { $limit: 1 },]);
                        if (otpTokenRecords.ResultData[0].token !== token && otpTokenRecords.ResultData.createdAt >= new Date()) {
                                ResponseBody.status = 401;
                                ResponseBody.message = "Invalid or expired token";
                                req.ResponseBody = ResponseBody;
                                return next();
                        }

                        /* ---------------- Update Password ---------------- */
                        const updatepwd = await MainDB.Update("tblcafe_employees", new _Employees(), [
                                { email },
                                {
                                        password: Methods.encryptPassword(password, employee.create_at),
                                        token: null
                                }
                        ]);

                        ResponseBody.status = updatepwd.status;
                        ResponseBody.message =
                                updatepwd.status === 200
                                        ? "Password updated successfully"
                                        : updatepwd.message;

                        req.ResponseBody = ResponseBody;
                        return next();

                } catch (error) {
                        console.error("Error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"]
                        };
                        return next();
                }
        }

        async UpdateEmployeeStatus(req, res, next) {
                try {
                        let ResponseBody = {};

                        const { _id, status } = req.body;

                        // 1️⃣ Basic validation
                        if (!_id || typeof status !== "number") {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Employee ID and status are required"
                                };
                                return next();
                        }

                        if (![0, 1].includes(status)) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Invalid Status."
                                };
                                return next();
                        }


                        // 2️⃣ Check employee exists
                        const chkemp = await MainDB.getmenual(
                                "tblcafe_employees",
                                new _Employees(),
                                [{ $match: { _id: new ObjectId(_id) } }]
                        );

                        if (!chkemp.ResultData.length) {
                                req.ResponseBody = {
                                        status: 404,
                                        message: "Employee not found"
                                };
                                return next();
                        }

                        // 3️⃣ Prepare update object
                        const updateData = {
                                _id: new ObjectId(_id),
                                status: status,
                        };

                        // 4️⃣ Update status
                        const updatedata = await MainDB.executedata('u', 'tblcafe_employees', new _Employees(), updateData);

                        ResponseBody.status = updatedata.status;
                        ResponseBody.message =
                                updatedata.status === 200
                                        ? "Employee status updated successfully."
                                        : updatedata.message;

                        req.ResponseBody = ResponseBody;
                        return next();

                } catch (error) {
                        console.error("Error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"]
                        };
                        return next();
                }
        }

        async UpdateEmployeeTheme(req, res, next) {
                try {
                        let ResponseBody = {};

                        const { _id, darkmodeaccess } = req.body;

                        // 1️⃣ Basic validation
                        if (!_id || typeof darkmodeaccess !== "number") {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Employee ID and status are required"
                                };
                                return next();
                        }

                        if (![0, 1].includes(darkmodeaccess)) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Invalid Status."
                                };
                                return next();
                        }


                        // 2️⃣ Check employee exists
                        const chkemp = await MainDB.getmenual("tblcafe_employees", new _Employees(), [{ $match: { _id: new ObjectId(_id) } }]);

                        if (!chkemp.ResultData.length) {
                                req.ResponseBody = {
                                        status: 404,
                                        message: "Employee not found"
                                };
                                return next();
                        }

                        // 3️⃣ Prepare update object
                        const updateData = {
                                _id: new ObjectId(_id),
                                darkmodeaccess: darkmodeaccess,
                        };

                        // 4️⃣ Update status
                        const updatedata = await MainDB.executedata('u', 'tblcafe_employees', new _Employees(), updateData);

                        ResponseBody.status = updatedata.status;
                        ResponseBody.message =
                                updatedata.status === 200
                                        ? "Employee status updated successfully."
                                        : updatedata.message;

                        req.ResponseBody = ResponseBody;
                        return next();

                } catch (error) {
                        console.error("Error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"]
                        };
                        return next();
                }
        }



        async AddUserRole(req, res, next) {
                try {
                        const fetchdata = await MainDB.getmenual("tblcafe_useroles", new _UserRoles(), [{ $match: { role: req.body.role } }])
                        if (fetchdata.ResultData.length) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: `${req.body.role} is already exists.`
                                }
                                return next()
                        }
                        const adddata = await MainDB.executedata("i", new _UserRoles(), "tblcafe_useroles", req.body)
                        req.ResponseBody = {
                                status: adddata.status,
                                message: adddata.status == 200 ? "Role Inserted" : adddata.message
                        }
                        next()
                } catch (error) {
                        console.error("Error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"]
                        };
                        return next();
                }
        }

        async RemoveUserRole(req, res, next) {
                try {
                        const deletedata = await MainDB.Delete("tblcafe_useroles", new _UserRoles(), { _id: new ObjectId(req.body._id) });
                        req.ResponseBody = {
                                status: deletedata.status,
                                message: deletedata.status == 200 ? "Role Deleted Successfully." : deletedata.message
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

        async UpdateUserRole(req, res, next) {
                try {
                        let ResponseBody = {}

                        let checkdata = await MainDB.getmenual('tblcafe_useroles', new _UserRoles(), [{ $match: { role: req.body.role, _id: { $ne: new ObjectId(req.body._id) } } }])
                        if (checkdata.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = `${req.body.role} already Exsist.`
                                req.ResponseBody = ResponseBody
                                return next()
                        }
                        let checkid = await MainDB.getmenual('tblcafe_useroles', new _UserRoles(), [{ $match: { _id: new ObjectId(req.body._id) } }])

                        if (!checkid.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = Config.errmsg['notexist']
                                req.ResponseBody = ResponseBody
                                return next()
                        }
                        req.body.updated_at = Methods.getdatetimeisostr()
                        const updatedata = await MainDB.Update('tblcafe_useroles', new _UserRoles(), [{ _id: new ObjectId(req.body._id) }, req.body])
                        ResponseBody.status = updatedata.status
                        ResponseBody.message = updatedata.status == 200 ? "Role Updated Successfully" : updatedata.message
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

        async ListUserRoles(req, res, next) {
                try {
                        var PaginationInfo = req.body.paginationinfo;
                        const requiredPage = { pageno: PaginationInfo.pageno, skip: (PaginationInfo.pageno - 1) * PaginationInfo.pagelimit, pagelimit: PaginationInfo.pagelimit };
                        var pipeline = [];
                        var sort = Object.keys(PaginationInfo.sort).length !== 0 ? PaginationInfo.sort : { _id: -1 };
                        pipeline.push(...Methods.GetPipelineForFilter(PaginationInfo.filter));
                        const searchtext = req.body.searchtext || ""
                        let projection = PaginationInfo.projection ? PaginationInfo.projection : {};

                        if (searchtext !== "") {
                                pipeline.push(...Methods.GetGlobalSearchFilter(new _UserRoles(), searchtext))
                        }

                        pipeline.push({ $match: { _id: { $ne: new ObjectId(Config.superadminroleid) } } }, { $project: { password: 0, create_at: 0, failedLoginAttempts: 0, lockUntil: 0 } })

                        const fetchdata = await MainDB.getmenual("tblcafe_useroles", new _UserRoles(), pipeline, requiredPage, sort, false, projection)

                        req.ResponseBody = {
                                status: 200,
                                message: Config.resstatuscode['200'],
                                data: fetchdata.ResultData,
                                currentpage: fetchdata.currentpage,
                                nextpage: fetchdata.nextpage,
                                totaldocs: fetchdata.totaldocs
                        };
                        next();
                } catch (error) {
                        console.error("Error:", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode["500"]
                        };
                        return next();
                }
        }




        async ListNotification(req, res, next) {
                try {
                        var PaginationInfo = req.body.paginationinfo;
                        const requiredPage = { pageno: PaginationInfo.pageno, skip: (PaginationInfo.pageno - 1) * PaginationInfo.pagelimit, pagelimit: PaginationInfo.pagelimit };
                        var pipeline = [];
                        var sort = Object.keys(PaginationInfo.sort).length !== 0 ? PaginationInfo.sort : { _id: -1 };
                        pipeline.push(...Methods.GetPipelineForFilter(PaginationInfo.filter));
                        const searchtext = req.body.searchtext || ""
                        let projection = PaginationInfo.projection ? PaginationInfo.projection : {};

                        if (searchtext !== "") {
                                pipeline.push(...Methods.GetGlobalSearchFilter(new _UserRoles(), searchtext))
                        }
                        pipeline.push({ $match: { receiverid: new ObjectId(req.headers.uid) } })
                        const listnotification = await MainDB.getmenual("tblcafe_notification", new _Notification(), pipeline, requiredPage, sort, false, projection)

                        req.ResponseBody = {
                                status: 200,
                                message: Config.resstatuscode['200'],
                                data: listnotification.ResultData,
                                currentpage: listnotification.currentpage,
                                nextpage: listnotification.nextpage,
                                totaldocs: listnotification.totaldocs
                        };
                        next();
                } catch (error) {
                        console.error("Error: ", error)
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async ReadNotification(req, res, next) {
                try {
                        let ResponseBody = {}
                        const { _id, allread } = req.body
                        const uid = req.headers.uid

                        if (!uid || typeof allread !== "number" || ![0, 1].includes(allread)) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Invalid request"
                                }
                                return next()
                        }

                        if (allread === 0) {
                                if (!_id) {
                                        req.ResponseBody = {
                                                status: 400,
                                                message: "Notification id is required"
                                        }
                                        return next()
                                }

                                const chknotification = await MainDB.getmenual(
                                        "tblcafe_notification",
                                        new _Notification(),
                                        [{ $match: { _id: new ObjectId(_id), receiverid: new ObjectId(uid) } }]
                                )

                                if (!chknotification.ResultData.length) {
                                        req.ResponseBody = {
                                                status: 404,
                                                message: "Notification not found"
                                        }
                                        return next()
                                }

                                const updatedata = await MainDB.Update(
                                        "tblcafe_notification",
                                        new _Notification(),
                                        [{ _id: new ObjectId(_id), receiverid: new ObjectId(uid) }, { read: 1 }]
                                )

                                ResponseBody.status = updatedata.status
                                ResponseBody.message = updatedata.status === 200 ? "Notification marked as read." : updatedata.message
                                req.ResponseBody = ResponseBody
                                return next()
                        }

                        const updatemany = await MainDB.UpdateMany(
                                "tblcafe_notification",
                                new _Notification(),
                                [{ receiverid: new ObjectId(uid), read: 0 }, { $set: { read: 1 } }]
                        )

                        req.ResponseBody = {
                                status: 200,
                                message: "All notifications marked as read.",
                                modifiedcount: updatemany.modifiedCount
                        }
                        return next()
                } catch (error) {
                        console.error("Error: ", error)
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        return next()
                }
        }
}
