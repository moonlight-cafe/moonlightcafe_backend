export default class FireBaseToken {
        constructor() {
                this._id
                this.token = { type: String, required: true, trim: true }
                this.isexpired = { type: Number, default: 0 }
                this.uid = { type: String, required: true, trim: true }
                this.platform = { type: String, required: true, trim: true }
                this.useragent = { type: String, required: true, trim: true }
                this.ipaddress = { type: String, required: true, trim: true }
                this.edate = { type: String, required: true, trim: true }
                this.appupdate = { type: String, required: true, trim: true }
        }
}