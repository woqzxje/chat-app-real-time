import mongoose from "mongoose";
import dns from "dns";

//Function to connect to the mongodb database
export const connectDB = async () => {
    try {
        // Force Google DNS to resolve MongoDB Atlas SRV records
        // Windows default DNS often blocks/refuses SRV lookups
        dns.setServers(['8.8.8.8', '8.8.4.4']);

        mongoose.connection.on('connected', () => console.log('Database Connected'));

        await mongoose.connect(`${process.env.MONGODB_URL}/chat-app`, {
            family: 4,
        });
    } catch (error) {
        console.log(error);
    }
}
