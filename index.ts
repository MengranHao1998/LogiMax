import { app } from "./app";
import { DB_WHConnect } from "./db-warehouse";

app.listen(app.get("port"), async () => {
    try {
        await DB_WHConnect();
        console.log( "[server] http://localhost/:" + app.get("port"));
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
});