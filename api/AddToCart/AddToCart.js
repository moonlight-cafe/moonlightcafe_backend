import { Config, Methods, MainDB } from "../../config/Init.js"
import _AddToCart from "../../model/AddToCart.js"
import _FinalOrders from "../../model/FinalOrders.js"
import _CustomerData from '../../model/CustomerDetails/CustomerDetails.js'
import _Tables from "../../model/Tables.js"
import _OrderRating from "../../model/Rating.js"

const ObjectId = Methods.getObjectId()
class AddToCart {
        async InsertAddToCart(req, res, next) {
                try {
                        const newCart = {
                                customerid: req.body.customerid,
                                data: req.body.data,
                                totalamount: req.body.totalamount,
                                servicetype: req.body.servicetype,
                                includetip: req.body.includetip,
                                tipamount: req.body.tipamount
                        };

                        await MainDB.executedata("i", new _AddToCart(), "tblcafe_tempcart", newCart);

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

                                                subtotal += price * qty

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
                                data: verifypayment.data.data
                        };

                        await MainDB.sendMail('', [customerdetails.data.email], template, '', senddata);

                        const uploaded = await Methods.GenerateBillPDF(senddata)

                        if (uploaded !== "") {
                                await MainDB.Update("tblcafe_finalorders", new _FinalOrders(), [
                                        { _id: new ObjectId(req.body._id) },
                                        { bill: uploaded }
                                ]);
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