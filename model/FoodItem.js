export default class FoodItem {
        constructor() {
                this._id
                this.name = { type: String, default: "", required: true }
                this.price = { type: String, default: "", required: true }
                this.image_url = { type: String, default: "", required: true }
        }
}

