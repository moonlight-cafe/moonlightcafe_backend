import mongoose from "mongoose"

export default class Rating {
        constructor() {
                this._id
                this.rating = { type: Number, required: true }
                this.review = { type: String, default: "" }
                this.customername = { type: String, default: "" }
                this.service = { type: Number, default: 1 }             // 1: Dine in 2: Take avay
                this.customerid = { type: mongoose.Schema.Types.ObjectId, default: null }
                this.customeremail = { type: String, default: "" }
                this.orderid = { type: mongoose.Schema.Types.ObjectId, default: null }
        }
}