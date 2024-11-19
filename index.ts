import { app } from "./app";
import { DBConnect } from "./db-warehouse";

app.listen(app.get("port"), async () => {
    try {
        await DBConnect();
        console.log( "[server] http://localhost/:" + app.get("port"));
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
});