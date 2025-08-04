import { Config, Methods, MainDB } from "../../config/Init.js"
import _AddToCart from "../../model/AddToCart.js"
import _FinalOrders from "../../model/FinalOrders.js"
import _CustomerData from '../../CustomerDetails/CustomerDetails.js'
import _Tables from "../../model/Tables.js"

const ObjectId = Methods.getObjectId()
class AddToCart {
        async InsertAddToCart(req, res, next) {
                try {
                        const newCart = {
                                customerid: req.body.customerid,
                                data: req.body.data,
                                totalamount: req.body.totalamount,
                                includetip: req.body.includetip,
                                tipamount: req.body.tipamount,
                                create_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
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
                                        { $match: { customerid: new ObjectId(req.body.customerid) } },
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
                                        { $match: { customerid: new ObjectId(req.body.customerid) } },
                                        { $sort: { _id: -1 } }
                                ])

                        if (!data.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = "No Orders Found!"
                                req.ResponseBody = ResponseBody
                                return next()
                        }

                        const newData = []

                        data.ResultData.forEach(order => {
                                if (Array.isArray(order.data)) {
                                        order.data.forEach(item => {
                                                newData.push({
                                                        foodid: item.foodid,
                                                        foodcode: item.foodcode || "",
                                                        foodname: item.foodname || "",
                                                        quantity: item.quantity || 1,
                                                        price: item.price || "",
                                                        imageurl: item.imageurl || ""
                                                });
                                        });
                                }
                        });

                        const lastorder = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), [{ $match: {} }, { $project: { orderno: 1 } }, { $sort: { _id: -1 } }, { $limit: 1 }])

                        let newOrderNumber = "ORD0000001";

                        if (lastorder.ResultData.length > 0 && lastorder.ResultData[0]?.orderno) {
                                const lastNum = parseInt(lastorder[0].orderno.replace("ORD", ""));
                                const nextNum = lastNum + 1;
                                newOrderNumber = "ORD" + nextNum.toString().padStart(7, '0');
                        }

                        const insertObj = {
                                orderno: newOrderNumber,
                                customerid: new ObjectId(req.body.customerid),
                                customername: req.body.customername,
                                isdinein: req.body.isdinein,
                                data: newData,
                                tableno: req.body.tableno,
                                orderid: req.body.orderid,
                                totalamount: req.body.totalamount,
                                includetip: req.body.includetip,
                                tipamount: req.body.tipamount,
                                create_at: Methods.getdatetimeisostr(),
                                paymentmode: "Pending",
                                paymentmethod: 0
                        };

                        const datacheck = await MainDB.executedata('i', new _FinalOrders(), "tblcafe_finalorders", insertObj)

                        await MainDB.DeleteMany('tblcafe_tempcart', new _AddToCart(), { customerid: new ObjectId(req.body.customerid) })
                        req.ResponseBody = {
                                status: 200,
                                message: "Success"
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
                        const fetchData = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), [{ $match: { customerid: new ObjectId(req.body.customerid) } }, { $sort: { _id: -1 } }, { $limit: 1 }])
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

        async ListDineinPayment(req, res, next) {
                try {
                        let ResponseBody = {}
                        let checkOrder = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), [{ $match: { _id: new ObjectId(req.body._id) } }])
                        if (!checkOrder.ResultData.length) {
                                ResponseBody.status = 400
                                ResponseBody.message = "Order not Found!!!"
                                req.ResponseBody = ResponseBody
                                return next()
                        }

                        let updateObj = {
                                paymentmode: req.body.paymentmethod == 1 ? "Cash" : "UPI",
                                paymentmethod: req.body.paymentmethod,
                                adminstatus: 1,
                                updated_at: Methods.getdatetimeisostr(),
                        }


                        let UpdatePayment = await MainDB.Update("tblcafe_finalorders", new _FinalOrders(), [{ _id: new ObjectId(req.body._id) }, updateObj])

                        ResponseBody.status = UpdatePayment.status
                        ResponseBody.message = UpdatePayment.status == 200 ? (req.body.paymentmethod == 1 ? "Payment Request Send to Admin." : "Payment Successful.") : UpdatePayment.message
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

        async ListPendingPayments(req, res, next) {
                try {
                        let ResponseBody = {}
                        const checkPendingOrders = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), [{ $match: {} }])

                        ResponseBody.status = 200
                        ResponseBody.message = "Orders Fetched"
                        ResponseBody.data = checkPendingOrders.ResultData
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


                        /* To CHNAGE AND UPDATE THE TABLE AVAILABLE AND REDIRECTION URL */
                        await MainDB.Update('tblcafe_customerdetails', new _CustomerData(), [{ _id: new ObjectId(req.body.customerid) }, { tblno: "", redirecturl: "" }])
                        let url;
                        let isUnique = false;
                        do {
                                url = Methods.generateRandomString(25);

                                const existing = await MainDB.getmenual("tblcafe_tables", new _Tables(), [{ $match: { url: url } }]);

                                if (!existing.ResultData.length) {
                                        isUnique = true;
                                }
                        } while (!isUnique);
                        await MainDB.Update("tblcafe_tables", new _Tables(), [{ url: req.body.url }, { url: url, isavailable: 1, usedby: null, usedbyname: "" }]);

                        /* To CHNAGE AND UPDATE THE TABLE AVAILABLE AND REDIRECTION URL */


                        /* TO CHANGE THE PAYMENT STATUS RECEIVED */
                        const checkPendingOrders = await MainDB.Update("tblcafe_finalorders", new _FinalOrders(), [{ _id: new ObjectId(req.body._id) }, { adminstatus: req.body.status, ispaid: req.body.status == 2 ? 1 : 0 }])
                        /* TO CHANGE THE PAYMENT STATUS RECEIVED */
                        ResponseBody.status = checkPendingOrders.status
                        ResponseBody.message = checkPendingOrders.status == 200 ? "Payment Received" : checkPendingOrders.message
                        // ResponseBody.data = checkPendingOrders.ResultData
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
                        const fetchData = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), [{ $match: { customerid: new ObjectId(req.body.customerid), ispaid: 1 } }])
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
}

export default AddToCart