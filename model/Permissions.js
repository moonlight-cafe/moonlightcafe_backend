import mongoose from "mongoose"
import { Methods } from "../config/Init.js"
const ObjectId = Methods.getObjectId()
export default class Permissions {
        constructor() {
                this.roleid = { type: mongoose.Schema.Types.ObjectId, required: true }
                this.employeeid = { type: mongoose.Schema.Types.ObjectId, default: null }
                this.menu_id = { type: mongoose.Schema.Types.ObjectId, required: true }
                this.menu_name = { type: String, required: true }
                this.menu_alias = { type: String, required: true }
                this.view = { type: Number, default: 1 }
                this.insert = { type: Number, default: 1 }
                this.update = { type: Number, default: 1 }
                this.delete = { type: Number, default: 1 }
        }
}
