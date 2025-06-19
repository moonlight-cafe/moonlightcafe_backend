export default class CustomerDetails {
        constructor() {
                this._id
                this.name = { type: String, required: true }
                this.number = { type: String, required: true }
                this.email = { type: String, required: true }
                this.password = { type: String, required: true }
                this.create_at = { type: String, required: true }
                this.updated_at = { type: String, required: true }
        }
}