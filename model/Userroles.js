import mongoose from "mongoose"

export default class OTP {
        constructor() {
                this._id
                this.role = { type: String, default: "" }
                this.status = { type: Number, default: 1 }
        }
}