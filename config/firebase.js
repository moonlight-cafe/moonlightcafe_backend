import admin from 'firebase-admin'
import _Config from "./Config.js";
const Config = new _Config()
// import { Config } from "./Init.js"

admin.initializeApp({
        credential: admin.credential.cert({
                "type": Config.firebasetype,
                "project_id": Config.firebaseproject_id,
                "private_key_id": Config.firebaseprivate_key_id,
                "private_key": Config.firebaseprivate_key,
                "client_email": Config.firebaseclient_email,
                "client_id": Config.firebaseclient_id,
                "auth_uri": Config.firebaseauth_uri,
                "token_uri": Config.firebasetoken_uri,
                "auth_provider_x509_cert_url": Config.firebaseauth_provider_x509_cert_url,
                "client_x509_cert_url": Config.firebaseclient_x509_cert_url,
                "universe_domain": Config.firebaseuniverse_domain
        }),
        // databaseURL: Config.FireBaseAdmin
})

const firebaseAdminobj = {};

firebaseAdminobj.sendMulticastNotification = async function (payload) {

        // Ensure all data values are strings (FCM requirement)
        const data = {};
        if (payload.data) {
                Object.keys(payload.data).forEach((key) => {
                        data[key] = String(payload.data[key]);
                });
        }

        const message = {
                tokens: payload.tokens,

                // 🔔 Notification content
                notification: {
                        title: payload.title,
                        body: payload.body,
                        // image: "https://res.cloudinary.com/dqdv99ydb/image/upload/v1757447223/Monlight_Cafe_Green_qbzvfd.png" // big banner (optional)
                        // image: "https://res.cloudinary.com/dqdv99ydb/image/upload/v1749141918/tempfolder/gmd4nf2stova0qct7h3o.png"
                },

                // ✅ THIS IS WHAT SHOWS THE LOGO
                webpush: {
                        notification: {
                                icon: "https://res.cloudinary.com/dqdv99ydb/image/upload/v1757447223/Monlight_Cafe_Green_qbzvfd.png",
                                badge: "https://res.cloudinary.com/dqdv99ydb/image/upload/v1757447223/Monlight_Cafe_Green_qbzvfd.png",
                                click_action: payload.clickaction || "/"
                        }
                },

                data: data
        };

        try {
                const response = await admin.messaging().sendEachForMulticast(message);
                return response;
        } catch (error) {
                console.error("Error sending multicast message:", error);
                throw error;
        }
};


export default firebaseAdminobj;