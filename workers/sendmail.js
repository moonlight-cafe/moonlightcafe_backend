import { parentPort, workerData } from 'worker_threads'
import nodemailer from 'nodemailer'
import { Methods } from '../config/Init.js';

// parentPort.postMessage(await sendMail(workerData))

async function sendMail(workerData) {
    try {
        //create transport
        var transporter = nodemailer.createTransport(workerData.mytransporterdata);
        var message_id = ""
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

        // console.log("mailOptions :", JSON.stringify(mailOptions) );
        
        // await transporter.sendMail({
        //     from: workerData.mailemailfrom,
        //     to: workerData.to,
        //     subject: workerData.mailsubject,
        //     text: workerData.text,
        //     html: workerData.html,
        //     attachments: workerData.mailattachments,
        //     bcc: workerData.mailbcc,
        //     cc: workerData.mailcc,
        // }, (error, info) => {
        const sendMailResp = await transporter.sendMail(mailOptions
            // , (error, info) => {
            //     if (error) {
            //         console.log(error)
            //     } else {
            //         message_id = info.messageId
            //     }
            // }
        )

        return { status: 'pass', message_id: sendMailResp.messageId }

    } catch (err) {
        console.log(err)
        return { status: 'fail', err: err }
    }
}

sendMail(workerData).then(result => parentPort.postMessage(result))