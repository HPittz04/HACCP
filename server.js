import express from "express";
import path from "path";
import helmet from "helmet";
import morgan from "morgan";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { fileURLToPath } from "url";
import ejsLayouts from "express-ejs-layouts";


dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Basic security headers
app.use(helmet({
  contentSecurityPolicy: false // Keep simple; tighten later
}));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({
  name: "session",
  keys: [process.env.SESSION_SECRET || "dev-secret"],
  maxAge: 24 * 60 * 60 * 1000
}));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use("/vendor", express.static(path.join(__dirname, "node_modules")));


// >>> Layouts
app.use(ejsLayouts);
app.set("layout", "layout"); // usa views/layout.ejs por omissão
// <<<

// Make some vars available to templates
app.use((req, res, next) => {
  res.locals.appName = "HACCP Guard Dashboard";
  res.locals.env = process.env.NODE_ENV || "development";
  next();
});

app.use("/", routes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Dashboard listening on http://localhost:${port}`);
});
