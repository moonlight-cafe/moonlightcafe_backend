export default class Category {
        constructor() {
                this._id
                this.name = { type: String, default: "", required: true }
                this.description = { type: String, default: "" }
                this.code = { type: String, default: "" }
                this.create_at = { type: String, default: "" }
        }
}

