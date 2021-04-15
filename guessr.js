const cheerio = require('cheerio');
const request = require('request');
const youtube_url_API = "https://script.google.com/macros/s/AKfycbw8fbqX60bwAzqGjM2XtwQRMusB2XywJRgAhIcFWKGP_jCS732lDFrweQ/exec"
const express = require('express');

return module.exports = {
    getSetByGenre: function (genre) {
        return new Promise((res_, rej_) => {
            request({
                method: 'GET',
                url: `https://www.letras.mus.br/mais-acessadas/${genre}/`
            }, (err, res, body) => {

                if (err) rej_(console.error(err));

                let $ = cheerio.load(body);
                var musicas = []

                $('.top-list_mus li').each(async (i, a) => {
                    musicas.push(
                        {
                            "href": $(a).find("A").first().attr('href'),
                            "title": $(a).find("B").first().text(),
                            author: $(a).find("span").first().text()
                        }
                    )


                })

                res_(musicas)
            });
        })
    },
    getRandomSongByGenre: async function (genre) {
        const musica = await this.getSetByGenre(genre).then(a => a).catch(() => null)
        return musica ? musica[Math.floor(Math.random() * musica.slice(0, 500).length)] : null
    },
    surfToSong: async function (musica) {
        if (!musica) return null;
        return new Promise((res_, rej_) => {
            request({
                method: 'GET',
                url: `https://www.letras.mus.br${musica.href}`
            }, (err, res, body) => {

                if (err) rej_(console.error(err));

                let $ = cheerio.load(body);
                var estrofes = []
                $('.cnt-letra > p').each(async (i, a) => {
                    const estrofe = $(a).html().split("<br>").join("\n")
                    estrofes.push(
                        estrofe
                    )
                })
                res_(estrofes)
            });
        })
    },
    getVideo: async function (musica) {
        return new Promise(async (res_, rej_) => {
            await request({
                url: youtube_url_API,
                method: "GET",
                useQuerystring: true,
                qs: { searchquery: musica }
            }, async (err, res, body) => {
                if(err) rej_(err)
                res_(await body)
                
            })
        })
    },
    generate: async function (genero) {
        if (this.generos.includes(genero)) {
            const musica = await this.getRandomSongByGenre(genero);
            if (!musica) return null
            return await this.surfToSong(musica)
                .then(async a => { return { musica: musica, estrofes: a } }).catch(() => null);
        } else {
            return null
        }
    },

    makeGuess: function (musica) {
        if (!musica.estrofes[1]) return null
        var answer = "";
        if (musica.estrofes[1].includes("\n")) {
            answer = musica.estrofes[1]
                .split("\n")[musica.estrofes[1].split("\n").length - 1]
                .split(" ")[musica.estrofes[1].split("\n")[musica.estrofes[1].split("\n").length - 1]
                    .split(" ").length - 1];
        } else {
            answer = musica.estrofes[1]
                .split(" ")[musica.estrofes[1].split(" ").length - 1];
        }

        dicas = [answer[0] + "...", "..." + answer[answer.length - 1]]

        dicas.push("Artist: " + musica.musica.author)
        dicas.push("Title: " + musica.musica.title)

        const guess = musica.estrofes[1].substring(0, musica.estrofes[1].lastIndexOf(" "));
        if (!answer || musica.guess) return null
        dicas.map(x => { if (x == undefined) { return null } })
        const regex = /Dog/ig;
        return { 'guess': guess + " " + answer.split(/[a-zA-Z\u00C0-\u00ff]/g).join("@"), 'answer': answer.split("\n").join(" "), 'dicas': dicas, musica: musica.musica }
    },
    generos: ["alternativo", "axe", "blues", "bolero",
        "bossa-nova", "brega", "classico", "country", "cuarteto",
        "cumbia", "dance", "disco", "eletronica", "emocore", "fado",
        "folk", "forro", "funk", "funk-internacional", "gospelreligioso",
        "grunge", "guarania", "gotico", "hard-rock", "hardcore",
        "heavy-metal", "hip-hop-rap", "house", "indie", "industrial",
        "infantil", "instrumental", "j-popj-rock", "jazz", "jovem-guarda",
        "k-popk-rock", "mpb", "mambo", "marchas-hinos", "mariachi", "merengue",
        "musica-andina", "new-age", "new-wave", "pagode", "pop", "poprock", "post-rock",
        "power-pop", "psicodelia", "punk-rock", "rb", "ranchera", "reggae", "reggaeton",
        "regional", "rock", "progressivo", "rock-roll", "rockabilly", "romantico", "salsa",
        "samba", "samba-enredo", "sertanejo", "ska", "soft-rock", "soul", "surf-music", "tango",
        "tecnopop", "trova", "velha-guarda", "world-music", "zamba", "zouk"]
}
