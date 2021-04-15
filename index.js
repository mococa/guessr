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

app.get('/', async (req, res) => {
    await get()
    async function get() {
        db.loadDatabase();
        var maisAcessados = []
        db.find({}, async function (err, docs) {
            if (err || !docs[0]) {
                db.insert(
                    await Object.assign({},
                        ...Guessr.generos.map(x => {
                            return { [x]: { popularidade: 0 } }
                        })
                    )
                    , (e, d) => { get() })
            }
            //Filtrando os 8 gêneros mais acessados
            try{
            maisAcessados = Object.entries(docs[0])
                .sort((a, b) => b[1]['popularidade'] - a[1]['popularidade'])
                .map(x => x[0]).slice(0, 8)
            return res.render("index", { generos: Guessr.generos, maisAcessados: maisAcessados })
            }catch(e){
                get()
            }
        })
    }
})

app.get("/g/:genero", async (req, res) => {
    const genero = req.params.genero
    if (Guessr.generos.includes(genero)) {
        let guess = await getSong(genero)
        //return res.send(guess)
        res.render("guess", { guess: guess, genero: genero })
    } else {
        return res.send("oops. gênero não encontrado.")
    }
})
app.get('/video/:musica', async (req, res) => {
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
    db.update({}, { $inc: { [query]: 1 } }, { multi: true })
    return guess
}
Array.prototype.randomArr = function () {
    return this
        .map((a) => ({ sort: Math.random(), value: a }))
        .sort((a, b) => a.sort - b.sort)
        .map((a) => a.value)
}