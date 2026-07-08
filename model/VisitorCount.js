import mongoose from "mongoose";

export default class VisitorCount {
        constructor() {
                this._id;
                this.pageName = { type: String, required: true, unique: true };
                this.count = { type: Number, default: 0 };
        }
}
