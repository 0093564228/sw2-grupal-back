// dotenv debe cargarse antes de importar la app (que construye el contenedor de DI).
import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
