import mongoose from "mongoose"

export default class ShiftAssign {
        constructor() {
                this._id
                this.employeeid = { type: mongoose.Schema.Types.ObjectId, required: true }
                this.employeedetails = { type: Object, required: true }
                this.shiftid = { type: mongoose.Schema.Types.ObjectId, required: true }
                this.shiftTimedetails = { type: Object, required: true }
                this.assigndate = { type: String, required: true } // YYYY-MM-DD
                this.assigndetails = { type: Object }
                this.status = { type: Number, default: 1 } // 1: Active, 0: Inactive
        }
}
