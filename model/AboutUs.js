import mongoose from "mongoose"

export default class AboutUs {
        constructor() {
                this._id
                this.title = { type: String, default: "", required: true }
                this.body = { type: mongoose.Schema.Types.Mixed, default: "" }
                this.sortby = { type: Number, default: 1 }
                this.isactive = { type: Number, default: 1 }
        }
}