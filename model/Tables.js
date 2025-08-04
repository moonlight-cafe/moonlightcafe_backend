import mongoose from "mongoose"

export default class Category {
        constructor() {
                this._id
                this.number = { type: Number, required: true }
                this.isavailable = { type: Number, default: 1 }           // 0: Not available(Busy)  1: Available   
                this.iscleaned = { type: Number, default: 1 }             // 0: Not Clean      1: Cleaned
                this.url = { type: String, default: "" }
                this.create_at = { type: String, default: "" }
                this.updated_at = { type: String, default: "" }
                this.usedby = { type: mongoose.Schema.Types.ObjectId, default: null }
                this.usedbyname = { type: String, default: "" }
        }
}