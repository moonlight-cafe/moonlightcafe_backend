import Razorpay from "razorpay";
import crypto from "crypto";
import { Config, Methods, MainDB } from "../../config/Init.js";
import _FinalOrders from "../../model/FinalOrders.js";
import _Employees from "../../model/Employees.js";
import _CustomerData from "../../model/CustomerDetails/CustomerDetails.js";
import _Tables from "../../model/Tables.js";

const ObjectId = Methods.getObjectId();

class Payment {
    async CreateRazorpayOrder(req, res, next) {
        try {
            const { amount, receipt } = req.body;

            const instance = new Razorpay({
                key_id: Config.razorpay_key_id,
                key_secret: Config.razorpay_secret,
            });

            const options = {
                amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
                currency: "INR",
                receipt: receipt,
            };

            const order = await instance.orders.create(options);

            req.ResponseBody = {
                status: 200,
                message: "Order created successfully",
                data: order,
            };
            next();
        } catch (error) {
            console.error("Razorpay Order Creation Error: ", error);
            req.ResponseBody = {
                status: 500,
                message: "Failed to create Razorpay order",
            };
            next();
        }
    }

    async VerifyRazorpayPayment(req, res, next) {
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                order_id, // Our system's internal _id of the order
            } = req.body;

            const body = razorpay_order_id + "|" + razorpay_payment_id;

            const expectedSignature = crypto
                .createHmac("sha256", Config.razorpay_secret)
                .update(body.toString())
                .digest("hex");

            const isAuthentic = expectedSignature === razorpay_signature;

            if (isAuthentic) {
                // Payment is valid, update the order
                const internalOrderId = new ObjectId(order_id);

                let checkOrder = await MainDB.getmenual(
                    "tblcafe_finalorders",
                    new _FinalOrders(),
                    [{ $match: { _id: internalOrderId } }]
                );

                if (!checkOrder.ResultData.length) {
                    req.ResponseBody = {
                        status: 400,
                        message: "Order not Found!!!",
                    };
                    return next();
                }

                const order = checkOrder.ResultData[0];

                let updateObj = {
                    paymentmode: "UPI",
                    paymentmethod: 2,
                    adminstatus: 2,
                    ispaid: 1,
                    updated_at: Methods.getdatetimeisostr(),
                };

                let UpdatePayment = await MainDB.Update("tblcafe_finalorders", new _FinalOrders(), [{ _id: internalOrderId }, updateObj]);

                // Notification to Admin
                const adminIds = Config.ADMIN_USER_IDS;
                await MainDB.sendNotifications({
                    tousers: [...adminIds],
                    payload: {
                        title: "Payment Successful",
                        body: `Online Payment completed for Order #${order.orderno}`,
                        type: "PAYMENT",
                        typeid: internalOrderId.toString(),
                        pagename: "order-details",
                        clickaction: "/orders",
                        clickflag: 1
                    }
                });

                // --- NEW: Run manual approval logic (free table, generate bill, send email) ---
                
                // 1. Free customer's table in customerdetails
                const customerdetails = await MainDB.Update('tblcafe_customerdetails', new _CustomerData(), [{ _id: new ObjectId(order.customerid) }, { tblno: "", redirecturl: "" }]);
                
                // 2. Free table in tblcafe_tables
                await MainDB.Update("tblcafe_tables", new _Tables(), [{ usedby: new ObjectId(order.customerid) }, { isavailable: 1, usedby: null, usedbyname: "" }]);

                // 3. Generate Bill Email and PDF
                let template = Config.emailtemplates['billing'];
                const orderItemsHTML = Methods.generateOrderItemsHTML(order.data);

                const senddata = {
                    ordno: order.orderno,
                    orddate: Methods.formatDateToCustom(order.createdAt),
                    customer: order.customername,
                    tblno: order.servicetype == 1 ? order.tableno : "-",
                    service: Methods.getServiceType(order.servicetype),
                    paymentmode: "UPI",
                    amount: `₹${order.amount}`,
                    tipamount: `₹${order.tipamount}`,
                    taxpercent: order.taxpercent,
                    taxamount: `₹${order.taxamount}`,
                    totalamount: `₹${order.totalamount}`,
                    orderitems: orderItemsHTML,
                    data: order.data,
                    appurl: Config.moonlightcafe
                };

                // Send email to customer
                if (customerdetails && customerdetails.data && customerdetails.data.email) {
                    await MainDB.sendMail('', [customerdetails.data.email], template, '', senddata);
                }

                // Generate PDF bill
                const uploaded = await Methods.GenerateBillHTML(senddata);

                // Update the order with the generated bill PDF URL
                if (uploaded !== "") {
                    await MainDB.Update("tblcafe_finalorders", new _FinalOrders(), [
                        { _id: internalOrderId },
                        { bill: uploaded }
                    ]);
                }

                // Unassign employees
                try {
                    const emps = await MainDB.getmenual("tblcafe_employees", new _Employees(), [{ $match: {} }]);
                    for (let emp of (emps.ResultData || [])) {
                        let arr = emp.activeorders || [];
                        let newArr = arr.filter(o => o.customerid.toString() !== order.customerid.toString());
                        if (arr.length !== newArr.length) {
                            await MainDB.Update("tblcafe_employees", new _Employees(), [{ _id: new ObjectId(emp._id) }, { activeorders: newArr }]);
                        }
                    }
                } catch (unassignErr) {
                    console.error("Error unassigning:", unassignErr);
                }

                req.ResponseBody = {
                    status: 200,
                    message: "Payment verified successfully",
                };
            } else {
                req.ResponseBody = {
                    status: 400,
                    message: "Payment signature mismatch",
                };
            }
            next();
        } catch (error) {
            console.error("Razorpay Verification Error: ", error);
            req.ResponseBody = {
                status: 500,
                message: "Internal Server Error",
            };
            next();
        }
    }
}

export default Payment;
