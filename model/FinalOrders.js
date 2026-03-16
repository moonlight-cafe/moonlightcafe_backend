import mongoose from "mongoose"

export default class FinalOrders {
        constructor() {
                this._id
                this.customerid = { type: mongoose.Schema.Types.ObjectId, required: true }
                this.customername = { type: String, required: true }
                this.servicetype = { type: Number, default: 1 }         // 1: Dine-In, 2: Take Away, 3: Reservation
                this.orderno = { type: String, default: "" }
                this.tableno = { type: String, default: "" }
                this.bill = { type: String, default: "" }
                this.orderid = { type: String, default: "" }
                this.data = [{
                        foodid: { type: mongoose.Schema.Types.ObjectId, required: true },
                        foodcode: { type: String, default: "" },
                        foodname: { type: String, default: "" },
                        quantity: { type: Number, default: 1 },
                        price: { type: String, default: "" },
                        imageurl: { type: String, default: "" }
                }]
                this.amount = { type: Number, default: 0 }
                this.includetip = { type: Number, default: 0 } // 0: No Tip 1: include Tip
                this.tipamount = { type: Number, default: 0 }

                this.allowtax = { type: Number, default: 0 }
                this.taxpercent = { type: Number, default: 0 }
                this.taxamount = { type: Number, default: 0 }
                this.totalamount = { type: Number, default: 0 } // with tax include

                this.ispaid = { type: Number, default: 0 }       // 0: Pending, 1: Paid
                this.adminstatus = { type: Number, default: 0 }                         // 0: N/A, 1: Pending, 2: Payment Received
                this.paymentmode = { type: String, default: "Pending" }                        // 1: Cash, 2: UPI
                this.paymentmethod = { type: Number, default: 0 }                       // 1: Cash, 2: UPI 
        }
}