let masterJSON

function preload() {
    masterJSON = loadJSON('master.json')
}

function setup() {
    for (let cardName of Object.keys(masterJSON)) {
        let card = masterJSON[cardName]

        let png = loadImage(card["png"])
        while (!(png)) {
            // essentially waits for the card image to be loaded
        }

        save(png, `cardImages/${cardName}.png`)
    }
}
