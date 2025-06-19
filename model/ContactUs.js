export default class Category {
        constructor() {
                this._id
                this.name = { type: String, default: "", required: true }
                this.email = { type: String, default: "" }
                this.contact = { type: String, default: "" }
                this.message = { type: String, default: "" }
                this.iscompleted = { type: Number, default: 0 }            // 0 : Pending   1: Verified
                this.remark = { type: String, default: "" }

                this.create_at = { type: String, default: "" }
                this.update_at = { type: String, default: "" }
        }
}