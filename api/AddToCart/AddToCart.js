import { Config, Methods, MainDB } from "../../config/Init.js"
import _AddToCart from "../../model/AddToCart.js"
import _FinalOrders from "../../model/FinalOrders.js"
import _CustomerData from '../../model/CustomerDetails/CustomerDetails.js'
import _Tables from "../../model/Tables.js"
import _OrderRating from "../../model/Rating.js"
import _ShiftTime from "../../model/ShiftTime.js"
import _ShiftAssign from "../../model/ShiftAssign.js"
import _Employees from "../../model/Employees.js"

const ObjectId = Methods.getObjectId()
class AddToCart {
        async InsertAddToCart(req, res, next) {
                try {
                        const customerid = new ObjectId(req.body.customerid);
                        const servicetype = req.body.servicetype;
                        let assignemployees = [];

                        // 1. Check if customer already has items in tblcafe_tempcart
                        const existingCart = await MainDB.getmenual("tblcafe_tempcart", new _AddToCart(), [
                                { $match: { customerid: customerid, servicetype: servicetype } },
                                { $limit: 1 }
                        ]);

                        if (existingCart.ResultData.length > 0 && Array.isArray(existingCart.ResultData[0].assignemployees) && existingCart.ResultData[0].assignemployees.length > 0) {
                                // 2. Reuse existing employees
                                assignemployees = existingCart.ResultData[0].assignemployees;
                        } else {
                                // 3. Assign new employees if none exist
                                try {
                                        const currentDate = new Date();
                                        const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
                                        const todayDateStr = [currentDate.getFullYear(), String(currentDate.getMonth() + 1).padStart(2, '0'), String(currentDate.getDate()).padStart(2, '0')].join('-');

                                        const allShifts = await MainDB.getmenual("tblcafe_shifttime", new _ShiftTime(), [{ $match: {} }]);

                                        let activeShiftIds = [];
                                        for (let shift of (allShifts.ResultData || [])) {
                                                const sM = parseInt((shift.startTime || "00:00").split(':')[0]) * 60 + parseInt((shift.startTime || "00:00").split(':')[1]);
                                                const eM = parseInt((shift.endTime || "00:00").split(':')[0]) * 60 + parseInt((shift.endTime || "00:00").split(':')[1]);
                                                if (sM <= eM) {
                                                        if (currentMinutes >= sM && currentMinutes <= eM) activeShiftIds.push(new ObjectId(shift._id));
                                                } else {
                                                        if (currentMinutes >= sM || currentMinutes <= eM) activeShiftIds.push(new ObjectId(shift._id));
                                                }
                                        }

                                        if (activeShiftIds.length > 0) {
                                                const activeAssignments = await MainDB.getmenual("tblcafe_shiftassign", new _ShiftAssign(), [{
                                                        $match: { assigndate: todayDateStr, status: 1, shiftid: { $in: activeShiftIds } }
                                                }]);

                                                const activeEmployeeIds = (activeAssignments.ResultData || []).map(a => new ObjectId(a.employeeid));

                                                if (activeEmployeeIds.length > 0) {
                                                        const activeEmployees = await MainDB.getmenual("tblcafe_employees", new _Employees(), [{
                                                                $match: { _id: { $in: activeEmployeeIds }, status: 1 }
                                                        }]);

                                                        let chefs = activeEmployees.ResultData.filter(e => e.role && e.role.toLowerCase() === 'chef');
                                                        let waiters = activeEmployees.ResultData.filter(e => e.role && e.role.toLowerCase() === 'waiter');

                                                        chefs.sort((a, b) => (a.activeorders?.length || 0) - (b.activeorders?.length || 0));
                                                        waiters.sort((a, b) => (a.activeorders?.length || 0) - (b.activeorders?.length || 0));

                                                        if (chefs.length > 0) {
                                                                assignemployees.push({
                                                                        employeeid: new ObjectId(chefs[0]._id),
                                                                        employeename: chefs[0].name,
                                                                        role: chefs[0].role,
                                                                        timestamp: new Date()
                                                                });
                                                        }

                                                        if (waiters.length > 0) {
                                                                assignemployees.push({
                                                                        employeeid: new ObjectId(waiters[0]._id),
                                                                        employeename: waiters[0].name,
                                                                        role: waiters[0].role,
                                                                        timestamp: new Date()
                                                                });
                                                        }
                                                }
                                        }
                                } catch (assignError) {
                                        console.error("Error during assignment logic:", assignError);
                                }
                        }

                        const newCart = {
                                customerid: customerid,
                                data: req.body.data,
                                totalamount: req.body.totalamount,
                                servicetype: servicetype,
                                includetip: req.body.includetip,
                                tipamount: req.body.tipamount,
                                assignemployees: assignemployees
                        };

                        const insertdata = await MainDB.executedata("i", new _AddToCart(), "tblcafe_tempcart", newCart);

                        // 4. Update employee active orders if a new assignment was made OR if we reuse existing ones for this specific cart item tracking
                        // (Usually we track the cart id which is new for every item in tempcart in this specific setup)
                        try {
                                const cartId = insertdata.data ? insertdata.data._id : new ObjectId();
                                const orderDetails = { cartid: cartId, customerid: customerid, totalamount: req.body.totalamount };

                                for (let emp of assignemployees) {
                                        const currentEmp = await MainDB.getmenual("tblcafe_employees", new _Employees(), [{ $match: { _id: new ObjectId(emp.employeeid) } }]);
                                        if (currentEmp.ResultData.length > 0) {
                                                let arr = currentEmp.ResultData[0].activeorders || [];
                                                arr.push(orderDetails);
                                                await MainDB.Update("tblcafe_employees", new _Employees(), [{ _id: new ObjectId(emp.employeeid) }, { activeorders: arr }]);
                                        }
                                }
                        } catch (updateEmpError) {
                                console.error("Error updating employee active orders:", updateEmpError);
                        }

                        req.ResponseBody = {
                                status: 200,
                                message: "Cart Inserted successfully"
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

        async ViewCart(req, res, next) {
                try {
                        const data = await MainDB.getmenual("tblcafe_tempcart",
                                new _AddToCart(),
                                [
                                        { $match: { customerid: new ObjectId(req.body.customerid), servicetype: req.body.servicetype } },
                                        { $sort: { _id: -1 } }
                                ])
                        req.ResponseBody = {
                                status: 200,
                                message: "View Cart",
                                data: data.ResultData
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

        async DineinBilling(req, res, next) {
                try {
                        let ResponseBody = {}
                        const data = await MainDB.getmenual("tblcafe_tempcart",
                                new _AddToCart(),
                                [
                                        { $match: { customerid: new ObjectId(req.body.customerid), servicetype: req.body.servicetype } },
                                        { $sort: { _id: -1 } }
                                ])

                        if (!data.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = "No Orders Found!"
                                req.ResponseBody = ResponseBody
                                return next()
                        }

                        const newData = []
                        let subtotal = 0
                        data.ResultData.forEach(order => {
                                if (Array.isArray(order.data)) {
                                        order.data.forEach(item => {
                                                const price = parseFloat(item.price || 0)
                                                const qty = parseInt(item.quantity || 1)

                                                subtotal += price

                                                newData.push({
                                                        foodid: item.foodid,
                                                        foodcode: item.foodcode || "",
                                                        foodname: item.foodname || "",
                                                        quantity: qty,
                                                        price: price,
                                                        imageurl: item.imageurl || ""
                                                })
                                        })
                                }
                        })
                        const tipAmount = parseFloat(req.body.tipamount || 0)
                        let taxPercent = 0
                        let taxAmount = 0
                        let totalAmount = 0

                        if (Config.allowtax === 1) {
                                taxPercent = req.body.servicetype == 1 ? Config.taxdetails.dineintax : Config.taxdetails.takeawaytax || 0
                                taxAmount = (subtotal * taxPercent) / 100
                                totalAmount = subtotal + taxAmount + tipAmount
                        } else {
                                totalAmount = subtotal + tipAmount
                        }

                        const lastorder = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), [{ $match: {} }, { $project: { orderno: 1 } }, { $sort: { _id: -1 } }, { $limit: 1 }])

                        let newOrderNumber = "ORD0000001";

                        if (lastorder.ResultData.length > 0 && lastorder.ResultData[0].orderno) {
                                const lastNum = parseInt(lastorder.ResultData[0].orderno.replace("ORD", ""));
                                const nextNum = lastNum + 1;
                                newOrderNumber = "ORD" + nextNum.toString().padStart(7, '0');
                        }

                        // Extract assignemployees from the first cart record (they should all be the same for this customer)
                        const assignemployees = data.ResultData[0].assignemployees || [];

                        const insertObj = {
                                orderno: newOrderNumber,
                                customerid: new ObjectId(req.body.customerid),
                                customername: req.body.customername,
                                servicetype: req.body.servicetype,
                                tableno: req.body.tableno,
                                orderid: req.body.orderid,

                                data: newData,

                                amount: subtotal,
                                includetip: req.body.includetip,
                                tipamount: tipAmount,

                                allowtax: Config.allowtax,
                                taxpercent: taxPercent,
                                taxamount: taxAmount,
                                totalamount: totalAmount,

                                paymentmode: "Pending",
                                paymentmethod: 0,
                                ispaid: 0,
                                adminstatus: 0,
                                assignemployees: assignemployees
                        }

                        const insertdata = await MainDB.executedata('i', new _FinalOrders(), "tblcafe_finalorders", insertObj)

                        await MainDB.DeleteMany('tblcafe_tempcart', new _AddToCart(), { customerid: new ObjectId(req.body.customerid), servicetype: req.body.servicetype })
                        req.ResponseBody = {
                                status: insertdata.status,
                                message: insertdata.message,
                                data: insertdata.data
                        }

                        next()
                } catch (error) {
                        console.error("Error: ", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async ListDineinBilling(req, res, next) {
                try {
                        const fetchData = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), [{ $match: { _id: new ObjectId(req.body.orderid), customerid: new ObjectId(req.body.customerid) } }, { $sort: { _id: -1 } }, { $limit: 1 }])
                        req.ResponseBody = {
                                status: 200,
                                message: "Data Found",
                                data: fetchData.ResultData
                        }
                        next()
                } catch (error) {
                        console.error("Error: ", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async CustomerDineinPayment(req, res, next) {
                try {
                        let ResponseBody = {}

                        const orderId = new ObjectId(req.body._id)

                        let checkOrder = await MainDB.getmenual(
                                "tblcafe_finalorders",
                                new _FinalOrders(),
                                [{ $match: { _id: orderId } }]
                        )

                        if (!checkOrder.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = "Order not Found!!!"
                                req.ResponseBody = ResponseBody
                                return next()
                        }

                        const order = checkOrder.ResultData[0]

                        let updateObj = {
                                paymentmode: req.body.paymentmethod == 1 ? "Cash" : "UPI",
                                paymentmethod: req.body.paymentmethod,
                                adminstatus: 1,
                                updated_at: Methods.getdatetimeisostr(),
                        }

                        let UpdatePayment = await MainDB.Update(
                                "tblcafe_finalorders",
                                new _FinalOrders(),
                                [{ _id: orderId }, updateObj]
                        )

                        /* ================= FIREBASE NOTIFICATION ================= */

                        const adminIds = Config.ADMIN_USER_IDS

                        if (req.body.paymentmethod == 1) {
                                await MainDB.sendNotifications({
                                        tousers: adminIds,
                                        payload: {
                                                title: "Cash Payment Request",
                                                body: `Cash payment requested for Order ${order.orderno}`,
                                                type: "PAYMENT",
                                                typeid: orderId.toString(),
                                                pagename: "dinein-order",
                                                clickaction: "/verify_payment",
                                                clickflag: 1,
                                                sid: checkOrder.ResultData[0].customerid.toString()
                                        }
                                })
                        } else {
                                await MainDB.sendNotifications({
                                        tousers: [...adminIds],
                                        payload: {
                                                title: "Payment Successful",
                                                body: `Payment completed for Order #${order.orderno}`,
                                                type: "PAYMENT",
                                                typeid: orderId.toString(),
                                                pagename: "order-details",
                                                clickaction: "/orders",
                                                clickflag: 1
                                        }
                                })
                        }

                        /* ========================================================== */

                        try {
                                const emps = await MainDB.getmenual("tblcafe_employees", new _Employees(), []);
                                for (let emp of (emps.ResultData || [])) {
                                        let arr = emp.activeorders || [];
                                        let newArr = arr.filter(o => o.customerid.toString() !== order.customerid.toString());
                                        if (arr.length !== newArr.length) {
                                                await MainDB.Update("tblcafe_employees", new _Employees(), [{ _id: new ObjectId(emp._id) }, { activeorders: newArr }]);
                                        }
                                }
                        } catch(unassignErr) {
                                console.error("Error unassigning:", unassignErr);
                        }

                        ResponseBody.status = UpdatePayment.status
                        ResponseBody.message =
                                UpdatePayment.status == 200
                                        ? req.body.paymentmethod == 1
                                                ? "Payment Request Sent to Admin."
                                                : "Payment Successful."
                                        : UpdatePayment.message

                        req.ResponseBody = ResponseBody
                        next()

                } catch (error) {
                        console.error("Error: ", error)
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async ListPendingPayments(req, res, next) {
                try {
                        let ResponseBody = {}
                        const PaginationInfo = req.body.paginationinfo;
                        const requiredPage = { pageno: PaginationInfo.pageno, skip: (PaginationInfo.pageno - 1) * PaginationInfo.pagelimit, pagelimit: PaginationInfo.pagelimit };
                        const pipeline = [];
                        if (PaginationInfo.filter.fromdate && PaginationInfo.filter.todate) {
                                pipeline.push(
                                        {
                                                $addFields: {
                                                        create_at_formatted: {
                                                                $dateToString: {
                                                                        timezone: "Asia/Kolkata",
                                                                        format: "%Y-%m-%d",
                                                                        date: "$createdAt",
                                                                }
                                                        }
                                                }
                                        },
                                        {
                                                $match: {
                                                        create_at_formatted: {
                                                                $gte: PaginationInfo.filter.fromdate,
                                                                $lte: PaginationInfo.filter.todate
                                                        }
                                                }
                                        }
                                );
                                delete PaginationInfo.filter.fromdate
                                delete PaginationInfo.filter.todate
                        }
                        const sort = Object.keys(PaginationInfo.sort).length !== 0 ? PaginationInfo.sort : { _id: -1 };
                        pipeline.push(...Methods.GetPipelineForFilter(PaginationInfo.filter));
                        const searchtext = req.body.searchtext || ""
                        const projection = PaginationInfo.projection ? PaginationInfo.projection : {};

                        if (searchtext !== "") {
                                pipeline.push(...Methods.GetGlobalSearchFilter(new _FinalOrders(), searchtext))
                        }

                        const checkOrders = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), pipeline, requiredPage, sort, false, projection)

                        ResponseBody.status = 200
                        ResponseBody.message = "Orders Fetched"
                        ResponseBody.data = checkOrders.ResultData
                        ResponseBody.totaldocs = checkOrders.totaldocs
                        ResponseBody.currentpage = checkOrders.currentpage
                        ResponseBody.nextpage = checkOrders.nextpage
                        req.ResponseBody = ResponseBody
                        next()
                } catch (error) {
                        console.error("Error: ", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async ReceivePendingPayments(req, res, next) {
                try {
                        let ResponseBody = {}
                        const customerdetails = await MainDB.Update('tblcafe_customerdetails', new _CustomerData(), [{ _id: new ObjectId(req.body.customerid) }, { tblno: "", redirecturl: "" }])
                        await MainDB.Update("tblcafe_tables", new _Tables(), [{ usedby: new ObjectId(req.body.customerid) }, { isavailable: 1, usedby: null, usedbyname: "" }]);

                        const verifypayment = await MainDB.Update("tblcafe_finalorders", new _FinalOrders(), [{ _id: new ObjectId(req.body._id) }, { adminstatus: req.body.status, ispaid: req.body.status == 2 ? 1 : 0 }])

                        let template = Config.emailtemplates['billing'];
                        const orderItemsHTML = Methods.generateOrderItemsHTML(verifypayment.data.data);

                        const senddata = {
                                ordno: verifypayment.data.orderno,
                                orddate: Methods.formatDateToCustom(verifypayment.data.createdAt),
                                customer: verifypayment.data.customername,
                                tblno: verifypayment.data.servicetype == 1 ? verifypayment.data.tableno : "-",
                                service: Methods.getServiceType(verifypayment.data.servicetype),
                                paymentmode: verifypayment.data.paymentmethod === 1 ? 'Cash' : 'UPI',
                                amount: `₹${verifypayment.data.amount}`,
                                tipamount: `₹${verifypayment.data.tipamount}`,
                                taxpercent: verifypayment.data.taxpercent,
                                taxamount: `₹${verifypayment.data.taxamount}`,
                                totalamount: `₹${verifypayment.data.totalamount}`,
                                orderitems: orderItemsHTML,
                                data: verifypayment.data.data,
                                appurl: Config.moonlightcafe
                        };

                        await MainDB.sendMail('', [customerdetails.data.email], template, '', senddata);

                        const uploaded = await Methods.GenerateBillPDF(senddata)

                        if (uploaded !== "") {
                                await MainDB.Update("tblcafe_finalorders", new _FinalOrders(), [
                                        { _id: new ObjectId(req.body._id) },
                                        { bill: uploaded }
                                ]);
                        }

                        try {
                                const emps = await MainDB.getmenual("tblcafe_employees", new _Employees(), []);
                                for (let emp of (emps.ResultData || [])) {
                                        let arr = emp.activeorders || [];
                                        let newArr = arr.filter(o => o.customerid.toString() !== req.body.customerid.toString());
                                        if (arr.length !== newArr.length) {
                                                await MainDB.Update("tblcafe_employees", new _Employees(), [{ _id: new ObjectId(emp._id) }, { activeorders: newArr }]);
                                        }
                                }
                        } catch(unassignErr) {
                                console.error("Error unassigning:", unassignErr);
                        }

                        ResponseBody.status = verifypayment.status
                        ResponseBody.message = verifypayment.status == 200 ? "Payment Received" : verifypayment.message
                        ResponseBody.bill = uploaded
                        req.ResponseBody = ResponseBody
                        next()
                } catch (error) {
                        console.error("Error: ", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async CheckAdminPaymentReceivedStatus(req, res, next) {
                try {
                        let ResponseBody = {}
                        const fetchadminstatus = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), [{ $match: { _id: new ObjectId(req.body._id) } }])

                        if (!fetchadminstatus.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = "Customer Order not Found !!"
                                req.ResponseBody = ResponseBody
                                return next()
                        }

                        if (fetchadminstatus.ResultData[0].adminstatus == 1) {
                                ResponseBody.status = 400
                                ResponseBody.message = "Admin Payment received Pending!!"
                                req.ResponseBody = ResponseBody
                                return next()
                        }

                        ResponseBody.status = 200
                        ResponseBody.message = "Payment Received!!"
                        req.ResponseBody = ResponseBody
                        return next()


                } catch (error) {
                        console.error("Error: ", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async ViewPastOrders(req, res, next) {
                try {
                        const fetchData = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), [{ $match: { customerid: new ObjectId(req.body.customerid), servicetype: { $in: req.body.servicetype } } }, { $sort: { _id: -1 } }])
                        req.ResponseBody = {
                                status: 200,
                                message: "Data Found",
                                data: fetchData.ResultData
                        }
                        next()
                } catch (error) {
                        console.error("Error: ", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async VerifyOrder(req, res, next) {
                try {
                        let ResponseBody = {}
                        const fetchData = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), [{ $match: { _id: new ObjectId(req.body._id) } }])

                        if (!fetchData.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = "Order not found. Please check the order ID."
                                req.ResponseBody = ResponseBody
                                return next()
                        }
                        if (req.body.verifyrateing) {
                                const fetchRating = await MainDB.getmenual("tblcafe_ratings", new _OrderRating(), [{ $match: { orderid: new ObjectId(req.body._id) } }])
                                if (fetchRating.ResultData.length) {
                                        ResponseBody.status = 400
                                        ResponseBody.message = "You have already submitted a rating for this order."
                                        req.ResponseBody = ResponseBody
                                        return next()
                                }
                        }

                        ResponseBody.status = 200
                        ResponseBody.message = Config.resstatuscode['200']
                        req.ResponseBody = ResponseBody
                        next()

                } catch (error) {
                        console.error("Error: ", error);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }










        async RatingAdd(req, res, next) {
                try {
                        const orderdata = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), [{ $match: { _id: new ObjectId(req.body.orderid) } }])

                        if (!orderdata.ResultData.length) {
                                req.ResponseBody = {
                                        status: 400,
                                        message: "Order not found."
                                }
                                return next()
                        }
                        req.body.service = orderdata.ResultData[0].servicetype

                        const adddata = await MainDB.executedata("i", new _OrderRating(), "tblcafe_ratings", req.body)


                        req.ResponseBody = {
                                status: adddata.status,
                                message: adddata.status == 200 ? "Thank you for your rating." : adddata.message
                        }
                        next()
                } catch (error) {

                }
        }

        async ListRating(req, res, next) {
                try {
                        var PaginationInfo = req.body.paginationinfo;
                        const requiredPage = { pageno: PaginationInfo.pageno, skip: (PaginationInfo.pageno - 1) * PaginationInfo.pagelimit, pagelimit: PaginationInfo.pagelimit };
                        var pipeline = [];
                        var sort = Object.keys(PaginationInfo.sort).length !== 0 ? PaginationInfo.sort : {};
                        pipeline.push(...Methods.GetPipelineForFilter(PaginationInfo.filter));
                        const searchtext = req.body.searchtext || ""
                        let projection = PaginationInfo.projection ? PaginationInfo.projection : {};

                        if (searchtext !== "") {
                                pipeline.push(...Methods.GetGlobalSearchFilter(new _OrderRating(), searchtext))
                        }

                        const fetchdata = await MainDB.getmenual("tblcafe_ratings", new _OrderRating(), pipeline, requiredPage, sort, false, projection)

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
}

export default AddToCart