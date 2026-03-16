import mongoose from "mongoose"

export default class Category {
        constructor() {
                this._id
                this.customerid = { type: mongoose.Schema.Types.ObjectId, required: true }
                this.servicetype = { type: Number, default: 1 }         // 1: Dine-In, 2: Take Away, 3: Reservation
                this.data = [{
                        foodid: { type: mongoose.Schema.Types.ObjectId, required: true },
                        foodcode: { type: String, default: "" },
                        foodname: { type: String, default: "" },
                        quantity: { type: Number, default: 1 },
                        price: { type: String, default: "" },
                        imageurl: { type: String, default: "" }
                }]
                this.totalamount = { type: String, default: "" }
        }
}