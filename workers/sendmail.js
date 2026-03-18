import { parentPort, workerData } from 'worker_threads'
import nodemailer from 'nodemailer'

async function sendMail(workerData) {
    try {
        console.log("🚀 ~ sendmail.js:5 ~ sendMail ~ workerData>>", workerData.mytransporterdata);
        var transporter = nodemailer.createTransport(workerData.mytransporterdata);
        console.log("🚀 ~ sendmail.js:8 ~ sendMail ~ transporter>>", transporter);
        await transporter.verify()
            .then(() => console.log("SMTP Ready"))
            .catch(err => console.error("SMTP Error:", err));
        const mailOptions = {
            from: workerData.mailemailfrom,
            to: workerData.to,
            subject: workerData.mailsubject,
            text: workerData.text,
            html: workerData.html,
            attachments: workerData.mailattachments,
            bcc: workerData.mailbcc,
            cc: workerData.mailcc,
        }
        console.log("🚀 ~ sendmail.js:20 ~ sendMail ~ mailOptions>>", mailOptions);

        const sendMailResp = await transporter.sendMail(mailOptions)
        console.log("🚀 ~ sendmail.js:26 ~ sendMail ~ sendMailResp.messageId>>", sendMailResp.messageId);

        return { status: 'pass', message_id: sendMailResp.messageId }
    } catch (err) {
        console.log(err)
        return { status: 'fail', err: err }
    }
}

sendMail(workerData).then(result => parentPort.postMessage(result))