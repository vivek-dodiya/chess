const express =  require("express");
const app = express();
const socketio = require("socket.io");
const path = require("path");
const http = require("http");
const { Chess } = require("chess.js");
const { error } = require("console");

const server = http.createServer(app);
const io = socketio(server);
const chess = new Chess();

app.set("view engine" ,"ejs");
app.use(express.static(path.join(__dirname, "public")));

let players = {}
let currentPlayer = "w"

app.get("/", (req,res)=>{
    res.render("index");
});

io.on("connection" , function (uniquesocket){
    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole" , "w");
    }else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole" , "b")
    }else{
        uniquesocket.emit("spectetorRole");
    };

    uniquesocket.on("disconnect" , function(){
        if(uniquesocket.id === players.white ){
            delete players.white;
        }else if(uniquesocket.id === players.black){
            delete players.black;
        }
    });  
    uniquesocket.on("move" , function(move){
        try{
            if(chess.turn() === "w" && uniquesocket.id !== players.white) return;
            if(chess.turn() === "b" && uniquesocket.id !== players.black) return;
            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit("move" , move);
                io.emit("boardState" , chess.fen());
            }else{
                console.log("Invalid move");
                uniquesocket.emit("InvalidMove",move)
            }
        }catch(err){
            console.error(err);
            uniquesocket.emit("invalidMove", move)
        }
    })
})

server.listen(3000)