import mongoose from "mongoose"

export default class Category {
        constructor() {
                this._id
                this.customerid = { type: mongoose.Schema.Types.ObjectId, required: true }
                this.data = [{
                        foodid: { type: mongoose.Schema.Types.ObjectId, required: true },
                        foodcode: { type: String, default: "" },
                        foodname: { type: String, default: "" },
                        quantity: { type: Number, default: 1 },
                        price: { type: String, default: "" },
                        imageurl: { type: String, default: "" }
                }]
                this.totalamount = { type: String, default: "" }
                this.create_at = { type: String, default: "" }
                this.updated_at = { type: String, default: "" }
        }
}