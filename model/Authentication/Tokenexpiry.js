export default class Tokenexpiry {
        constructor() {
                this._id
                this.unqkey = { type: String, required: true }
                this.uid = { type: String, required: true }
                this.iss = { type: String, required: true }
                this.token = { type: String, required: true }
                this.useragent = { type: String, required: true }
                this.exp = { type: String, required: true }
                this.entry_date = { type: Date, required: true }
                this.isvalid = { type: Number, required: true }
                this.update_date = { type: String }
        }
}    