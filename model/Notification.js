import mongoose from "mongoose"

export default class Notification {
        constructor() {
                this._id;
                this.title = { type: String, required: false, trim: true };
                this.body = { type: Object, required: false };
                this.type = { type: String, required: false, trim: true };
                this.pagename = { type: String, required: false, trim: true }; // alias
                this.arguments = { type: mongoose.Schema.Types.Mixed };
                this.clickaction = { type: String, required: false, trim: true };
                this.clickflag = { type: String, required: false, trim: true }
                this.actionname = { type: String, required: false, trim: true }
                this.receiverid = { type: mongoose.Schema.Types.ObjectId, ref: 'tblcafe_employees' };
                this.status = { type: Number, default: 1 };
                this.time = { type: Date, required: false, trim: true, default: new Date() };
                this.sid = { type: String, required: false, trim: true };
                this.read = { type: Number, default: 0 };
                this.iconimage = { type: String, required: false, trim: true };
                this.notificationcolor = { type: String, required: false, trim: true };
        }
}