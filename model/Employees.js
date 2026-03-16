import mongoose from "mongoose"

export default class Employees {
        constructor() {
                this._id
                this.employeeid = { type: String, required: true }
                this.fname = { type: String, required: true }
                this.lname = { type: String, required: true }
                this.name = { type: String, required: true }
                this.number = { type: String, required: true }
                this.email = { type: String, required: true }

                this.role = { type: String, required: true }
                this.roleid = { type: mongoose.Schema.Types.ObjectId, required: true }

                this.darkmodeaccess = { type: Number, default: 0 }

                this.status = { type: Number, default: 1 }   //1:Active
                this.password = { type: String, required: true }
                this.create_at = { type: String, required: true }

                this.failedLoginAttempts = { type: Number, default: 0 };
                this.lockUntil = { type: Date, default: null };

                this.twoFactorEnabled = { type: Number, default: 0 };
                this.twoFactorSecret = { type: String, default: "" };
                this.twoFactorTempToken = { type: String, default: "" };
                this.twoFactorTempTokenExpiry = { type: String, default: "" };
        }
}
