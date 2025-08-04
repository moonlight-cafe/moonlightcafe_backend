import mongoose from "mongoose"

export default class Category {
        constructor() {
                this._id
                this.customerid = { type: mongoose.Schema.Types.ObjectId, required: true }
                this.foodid = { type: mongoose.Schema.Types.ObjectId, required: true }
                this.foodcode = { type: String, default: "" }
                this.create_at = { type: String, default: "" }
                this.updated_at = { type: String, default: "" }
        }
}