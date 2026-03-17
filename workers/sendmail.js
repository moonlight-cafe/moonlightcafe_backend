import { parentPort, workerData } from 'worker_threads'
import nodemailer from 'nodemailer'
import { Methods } from '../config/Init.js';

async function sendMail(workerData) {
    try {
        var transporter = nodemailer.createTransport(workerData.mytransporterdata);
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

        if (!Methods.checkForNullValues(workerData?.inReplyTo)) mailOptions.inReplyTo = workerData.inReplyTo
        if (Array.isArray(workerData?.references) && workerData?.references.length > 0) mailOptions.references = workerData?.references;
        const sendMailResp = await transporter.sendMail(mailOptions)
        return { status: 'pass', message_id: sendMailResp.messageId }
    } catch (err) {
        console.log("🚀 ~ sendmail.js:1 ~ sendMail ~ err>>", err);
        return { status: 'fail', err: err }
    }
}

sendMail(workerData).then(result => parentPort.postMessage(result))