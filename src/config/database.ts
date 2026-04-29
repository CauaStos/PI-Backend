import mongoose from "mongoose";

class Database{

    public async connect():Promise<void>{
        try{
            await mongoose.connect(process.env.MONGO_URI as string);
            console.log("Mongo conectado com sucesso");
        } catch (error){
            console.log("Erro ao conectar ao MongoBD", error);
            process.exit(1);
        }
    }
}

export default new Database();