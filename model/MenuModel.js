import mongoose from "mongoose"

export default class Category {
        constructor() {
                this._id
                this.name = { type: String, default: "", required: true }
                // this.alias = { type: String, default: "", required: true }
                this.submenu = { type: Number, default: 0 }                         // 0: Parent Menu, 1: Sub Menu 
                this.parentmenuid = { type: mongoose.Schema.Types.ObjectId, default: null }
                this.displayorder = { type: Number, default: 1 }
                this.icon = { type: String, default: "" }
                this.redirecturl = { type: String, default: "" }
                this.isactive = { type: Number, default: 1 }       //1: Enable 0: Disable
                this.defaultpermission = { type: Number, default: 0 }       //1: Enable 0: Disable
        }
}