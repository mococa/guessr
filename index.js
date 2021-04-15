const express = require('express')
const app = express()
const Guessr = require('./guessr')
var Datastore = require('nedb')
var db = new Datastore('database.db');
db.loadDatabase();

// Setando as views publicas (HTML) 
app.use(express.static('public'))

app.use('/fa', express.static(__dirname + '/node_modules/font-awesome/css'));
app.use('/fonts', express.static(__dirname + '/node_modules/font-awesome/fonts'));


app.set('views', './public/views')
app.set('view engine', 'ejs')

app.listen(3000, () => { console.log("Listening to port 3000") })

app.get('/', (req, res) => {
    var maisAcessados = []
    db.find({}, function (err, docs) {
        //Filtrando os 8 gêneros mais acessados
        maisAcessados = Object.entries(docs[0])
            .sort((a, b) => b[1]['popularidade'] - a[1]['popularidade'])
            .map(x => x[0]).slice(0, 8)
        res.render("index", { generos: Guessr.generos, maisAcessados: maisAcessados })
    })
})

app.get("/g/:genero", async (req, res) => {
    const genero = req.params.genero
    if (Guessr.generos.includes(genero)) {
        let guess = await getSong(genero)
        //return res.send(guess)
        res.render("guess", {guess:guess, genero:genero})
    } else {
        return res.send("oops. gênero não encontrado.")
    }
})
app.get('/video/:musica', async (req,res)=>{
    const video = await Guessr.getVideo(req.params.musica)
    return res.send(video)
})
async function getSong(genero) {
    var musica = null
    var guess = null
    while (!guess) { // Handle fails
        musica = await Guessr.generate(genero)
        guess = Guessr.makeGuess(musica);
    }
    guess.dicas = guess.dicas.randomArr()
    const query = genero + ".popularidade"
    db.update({ _id: "jbKxW5UKs8GzR6aa" }, { $inc: { [query]: 1 } }, {})
    return guess
}
Array.prototype.randomArr = function () {
    return this
        .map((a) => ({ sort: Math.random(), value: a }))
        .sort((a, b) => a.sort - b.sort)
        .map((a) => a.value)
}