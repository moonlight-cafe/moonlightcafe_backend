import { Config, Methods, MainDB } from "../config/Init.js"

export default class Dashboard {
        async HomePageFoodTagLine(req, res, next) {
                try {
                        // const response = await Methods.AxiosRequest(
                        //         Config.GEMINI_API_URL,
                        //         "POST",
                        //         {
                        //                 contents: [
                        //                         {
                        //                                 parts: [
                        //                                         {
                        //                                                 text: `${req.body.prompt}`,
                        //                                         },
                        //                                 ],
                        //                         },
                        //                 ],
                        //         },
                        //         { "X-goog-api-key": Config.GoogleAPIKey }
                        // );

                        // if (response.success == false) {
                        //         req.ResponseBody = {
                        //                 status: 200,
                        //                 message: Config.errmsg['datafound'],
                        //                 tagline: "ઘર જેવો સ્વાદ, મમ્મી નું ટિફિન."
                        //         }
                        //         return next()
                        // }
                        // const tagline = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "ઘર જેવો સ્વાદ, મમ્મી નું ટિફિન.";
                        const tagline = "ઘર જેવો સ્વાદ, મમ્મી નું ટિફિન.";

                        req.ResponseBody = {
                                status: 200,
                                message: Config.errmsg['datafound'],
                                tagline: tagline
                        }
                        next()
                } catch (error) {
                        console.error("Login error:", error);
                        req.ResponseBody = { status: 500, message: "Internal Server Error", error: error.message };
                        return next();
                }
        }
}