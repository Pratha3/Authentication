import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";

const app = express();
//const httpServer = createServer(app);

connectDB();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);

//initSockets(httpServer);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
