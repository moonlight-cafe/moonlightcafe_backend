import mongoose from "mongoose"

export default class Category {
        constructor() {
                this._id
                this.customerid = { type: mongoose.Schema.Types.ObjectId, required: true }
                this.customername = { type: String, required: true }
                this.orderno = { type: String, default: "" }
                this.tableno = { type: String, default: "" }
                this.orderid = { type: String, default: "" }
                this.isdinein = { type: Number, default: 1 }                    // 1: Dine In , 2 Take Away
                this.data = [{
                        foodid: { type: mongoose.Schema.Types.ObjectId, required: true },
                        foodcode: { type: String, default: "" },
                        foodname: { type: String, default: "" },
                        quantity: { type: Number, default: 1 },
                        price: { type: String, default: "" },
                        imageurl: { type: String, default: "" }
                }]
                this.totalamount = { type: String, default: "" }
                this.includetip = { type: Number, default: 0 } // 0: No Tip 1: include Tip
                this.tipamount = { type: Number, default: 0 }
                this.ispaid = { type: Number, default: 0 }       // 0: Pending, 1: Paid
                this.adminstatus = { type: Number, default: 0 }                         // 0: N/A, 1: Pending, 2: Payment Received
                this.paymentmode = { type: String, default: "" }                        // 1: Cash, 2: UPI
                this.paymentmethod = { type: Number, default: 0 }                       // 1: Cash, 2: UPI 
                this.create_at = { type: String, default: "" }
                this.updated_at = { type: String, default: "" }
        }
}