export default class Category {
        constructor() {
                this._id
                this.name = { type: String, default: "", required: true }
                this.category = { type: String, default: "" }
                this.categorycode = { type: String, default: "" }
                this.code = { type: String, default: "" }
                // this.description = { type: String, default: "" }
                this.price = { type: String, default: "" }
                this.url = { type: String, default: "" }
                this.isactive = { type: Number, default: 1 }       //1: Enable 0: Disable
        }
}