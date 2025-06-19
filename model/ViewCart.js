export default class ViewCart {
        constructor() {
                this._id
                this.name = { type: String, required: true }
                this.price = { type: String, required: true }
                this.email = { type: Date, required: true,  }
                this.created_at = { type: Object, required: true }
                this.updated_at = { type: Object, required: true }
                this.foodid = { type: String, required: true }
                this.table = { type: String, required: true }
                this.quantity = { type: String, required: true }
        }
}

