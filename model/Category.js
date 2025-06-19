export default class Category {
        constructor() {
                this._id
                this.name = { type: String, default: "", required: true }
                this.code = { type: String, default: "" }
                this.isactive = { type: Number, default: 1 }       //1: Enable 0: Disable
                this.create_at = { type: String, default: "" }
                this.updated_at = { type: String, default: "" }
        }
}

