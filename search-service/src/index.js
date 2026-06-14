import dotenv from "dotenv"
import { startServer } from "./app.js";

dotenv.config({
    path: './.env'
})

startServer().catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
});

// app.listen(process.env.PORT , () => {
//     console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
// })
