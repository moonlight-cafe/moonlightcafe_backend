import mongoose from "mongoose"

export default class TakeAway {
        constructor() {
                this._id
                this.redirecturl = { type: String, required: true }
                this.customername = { type: String, default: "" }
                this.customerid = { type: mongoose.Schema.Types.ObjectId, default: null }
                this.customeremail = { type: String, default: "" }
                this.customercontact = { type: String, default: "" }
                this.created_at = { type: String, default: "" }
                this.updated_at = { type: String, default: "" }
                this.billno = { type: String, default: "" }
                this.ispaid = { type: Number, default: 0 }              // 0: Pending   1: Paid
                this.ammount = { type: String, default: "0" }
        }
}