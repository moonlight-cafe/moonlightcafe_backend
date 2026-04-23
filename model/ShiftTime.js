import mongoose from "mongoose"

export default class ShiftTime {
        constructor() {
                this._id
                this.timeSlotName = { type: String, required: true }
                this.startTime = { type: String, required: true }
                this.endTime = { type: String, required: true }
        }
}
