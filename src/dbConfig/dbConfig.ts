import mongoose from "mongoose";
let isConnected = false; 

export async function connect(){
     if (isConnected) {
    return;
  }
 try{
    await mongoose.connect(process.env.MONGO_URI!);
    isConnected = true;
    const connection = mongoose.connection;

    connection.once('connected',()=>{
        console.log("mongoosDB connected successfully");
    })

    connection.once('error',(err)=>{
        console.log('MongoDB connection error.Please make sure MongoDB is connected'+err);
        process.exit();
    })
 isConnected = true;
 }
 catch(error){
    console.log('Something went wrong,while connecting the DataBase');
    console.log(error);
 }
}
