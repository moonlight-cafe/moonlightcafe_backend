export default class CustomerDetails {
        constructor() {
                this._id
                this.uniqueid = { type: String, required: true }
                this.name = { type: String, required: true }
                this.number = { type: String, default: "" }
                this.email = { type: String, required: true }
                this.password = { type: String, required: true }
                this.create_at = { type: String, required: true }
                this.tblno = { type: String, default: "" }
                this.redirecturl = { type: String, default: "" }
                this.isGoogleAccount = { type: Number, default: 0 }

                this.failedLoginAttempts = { type: Number, default: 0 };
                this.lockUntil = { type: Date, default: null };
        }
}