export default class FailMailRecord {
        constructor() {
                this.emailfrom = { type: String, required: true }
                this.emailto = { type: String, required: true }
                this.templateid = { type: String, required: true }
                this.subject = { type: String, required: true }
                this.data = { type: String, required: true }
                this.body = { type: String, required: true }
                this.files = { type: String, required: true }
                this.bcc = { type: String, required: true }
                this.cc = { type: String, required: true }
                this.sendername = { type: String, required: true }
                this.emailhostid = { type: String, required: true }
                this.attachments = { type: String, required: true }
                this.refdata = { type: String, required: true }
                this.toname = { type: String, required: true }
                this.datetime = { type: Date, default: new Date() }
        }
}

