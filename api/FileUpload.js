import { Config, Methods, MainDB, cloudinary } from "../config/Init.js";

const ObjectId = Methods.getObjectId();

class FileUpload {
        async fileupload(req, res, next) {
                try {
                        if (!req.files || !req.files.image) {
                                return res.status(400).json({ message: 'No image uploaded' });
                        }
                        const foldername = Methods.getfoldername(req.body?.foldername)
                        const file = req.files.image;

                        const base64Data = `data:${file.mimetype};base64,${file.data.toString("base64")}`;

                        const result = await cloudinary.uploader.upload(base64Data, {
                                folder: foldername
                        });

                        req.ResponseBody = {
                                status: 200,
                                message: "File Uploaded",
                                url: result.secure_url
                        };
                        console.log("🚀 ~ FileUpload.js:27 ~ FileUpload ~ fileupload ~ req.ResponseBody.result.secure_url>>", result.secure_url);


                        next();
                } catch (err) {
                        console.error(err);
                        res.status(500).json({ message: 'Upload failed', error: err.message });
                }
        }
}

export default FileUpload