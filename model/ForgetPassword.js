import mongoose from "mongoose"

export default class OTP {
        constructor() {
                this._id
                this.customerid = { type: mongoose.Schema.Types.ObjectId, required: true }
                this.customeemail = { type: String, required: true }
                this.oldpassword = { type: String, default: "" }
                this.newpassword = { type: String, default: "" }
                this.otp = { type: String, default: "" }
                this.token = { type: String, default: "" }
                this.verifiedtoken = { type: Number, default: 0 }
                this.tokentimestamp = { type: String, default: "" }
                this.attempt = { type: Number, default: 0 }             //   Only 3 attempt
                this.isverified = { type: Number, default: 0 }          //   1: OTP Verified
                this.create_at = { type: String, default: "" }
                this.updated_at = { type: String, default: "" }
        }
}