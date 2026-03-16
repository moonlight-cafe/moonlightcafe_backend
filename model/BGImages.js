export default class FireBaseToken {
        constructor() {
                this.url = { type: String, required: true, trim: true }
                this.status = { type: Number, default: 1 }
        }
}