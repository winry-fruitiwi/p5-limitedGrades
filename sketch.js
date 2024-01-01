/**
 *  @author Winry Tian
 *  @date 2023.10.22
 *
 *  This is an imitation of limitedGrades.com, but on p5.js canvas.
 *
 *  The new features I'm aiming to implement are:
 *      Improved search bar: looking up multiple cards at once with fuzzywuzzy.
 *      Maybe functionality in DevTools: controls.
 *
 *  I'm not planning to keep:
 *      Changing between data for sets. This depends on py-util's development.
 *      Most buttons. They'll be replaced by hotkeys.
 *      Type filters. This will mostly be replaced by improved search bar.
 *
 */

let font
let fixedWidthFont
let variableWidthFont
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */
let BACKGROUND_COLOR
let requiredHeight /* variable used for resizing the canvas every draw frame */
let masterJSON
let cardBuckets
let cardImages = {}
let detailedCardWindowImages = {}
let mouseJustClicked = false
let mouseJustClickedOnCard = false
let grayScreen = false
let cardClickedData
let c, w, u, b, r, g, gold


function preload() {
    font = loadFont('data/consola.ttf')
    fixedWidthFont = loadFont('data/consola.ttf')
    variableWidthFont = loadFont('data/meiryo.ttf')

    masterJSON = loadJSON('master.json', gotJSON)
}

function gotJSON(data) {
    // Define the key you want to sort by
    let keyToSortBy = "GIH WR";

    // Convert the dictionary into an array of key-value pairs
    let entries = Object.entries(data);

    // Sort the array based on the specified key's value within the "all" dictionary
    entries.sort((a, b) => {
        if ((a[1]["stats"]["all"]["all"]) &&
            (b[1]["stats"]["all"]["all"])
        ) {
            let valueA = a[1]["stats"]["all"]["all"][keyToSortBy];
            let valueB = b[1]["stats"]["all"]["all"][keyToSortBy];
            return valueA - valueB;
        }
    });

    // Create a new object (dictionary) from the sorted array
    data = Object.fromEntries(entries)

    for (let cardName of Object.keys(data)) {
        cardImages[cardName] = loadImage(`cardImages/${cardName}.png`)
        detailedCardWindowImages[cardName] = loadImage(`cardImages/${cardName}.png`)
    }
}

// iterates through each card and process each card into buckets
function processMasterData() {
    // buckets for each card to go into
    let buckets = {
        "W": {
            "S ": {},
            "A+": {},
            "A ": {},
            "A-": {},
            "B+": {},
            "B ": {},
            "B-": {},
            "C+": {},
            "C ": {},
            "C-": {},
            "D+": {},
            "D ": {},
            "D-": {},
            "F ": {},
        },
        "U": {
            "S ": {},
            "A+": {},
            "A ": {},
            "A-": {},
            "B+": {},
            "B ": {},
            "B-": {},
            "C+": {},
            "C ": {},
            "C-": {},
            "D+": {},
            "D ": {},
            "D-": {},
            "F ": {},
        },
        "B": {
            "S ": {},
            "A+": {},
            "A ": {},
            "A-": {},
            "B+": {},
            "B ": {},
            "B-": {},
            "C+": {},
            "C ": {},
            "C-": {},
            "D+": {},
            "D ": {},
            "D-": {},
            "F ": {},
        },
        "R": {
            "S ": {},
            "A+": {},
            "A ": {},
            "A-": {},
            "B+": {},
            "B ": {},
            "B-": {},
            "C+": {},
            "C ": {},
            "C-": {},
            "D+": {},
            "D ": {},
            "D-": {},
            "F ": {},
        },
        "G": {
            "S ": {},
            "A+": {},
            "A ": {},
            "A-": {},
            "B+": {},
            "B ": {},
            "B-": {},
            "C+": {},
            "C ": {},
            "C-": {},
            "D+": {},
            "D ": {},
            "D-": {},
            "F ": {},
        },
        "GOLD": {
            "S ": {},
            "A+": {},
            "A ": {},
            "A-": {},
            "B+": {},
            "B ": {},
            "B-": {},
            "C+": {},
            "C ": {},
            "C-": {},
            "D+": {},
            "D ": {},
            "D-": {},
            "F ": {},
        },
        "C": {
            "S ": {},
            "A+": {},
            "A ": {},
            "A-": {},
            "B+": {},
            "B ": {},
            "B-": {},
            "C+": {},
            "C ": {},
            "C-": {},
            "D+": {},
            "D ": {},
            "D-": {},
            "F ": {},
        }
    }

    for (let cardName of Object.keys(masterJSON)) {
        let card = masterJSON[cardName]

        let cardGrade

        if (card["stats"]["all"]["all"])
            cardGrade = card["stats"]["all"]["all"]["GIH grade"]
        else
            continue

        if (card["color"].length === 0) {
            buckets["C"][cardGrade][cardName] = card
        }

        else if (card["color"].length === 1) {
            buckets[card["color"]][cardGrade][cardName] = card
        }

        else {
            buckets["GOLD"][cardGrade][cardName] = card
        }
    }

    console.log(buckets)

    return buckets
}


function setup() {
    let cnv = createCanvas(windowWidth - 40 /* random margin */, 700)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 14)

    /* initialize instruction div */
    instructions = select('#ins')
    instructions.html(`<pre>
        numpad 1 → freeze sketch</pre>`)

    debugCorner = new CanvasDebugCorner(5)

    BACKGROUND_COLOR = color(0, 0, 9)

    cardBuckets = processMasterData()

    c = loadImage("manaSymbols/c.png")
    w = loadImage("manaSymbols/w.png")
    u = loadImage("manaSymbols/u.png")
    b = loadImage("manaSymbols/b.png")
    r = loadImage("manaSymbols/r.png")
    g = loadImage("manaSymbols/g.png")
    gold = loadImage("manaSymbols/gold.png")
}


function draw() {
    if ((height !== requiredHeight) || (width !== windowWidth - 40)) {
        resizeCanvas(windowWidth - 40, requiredHeight, true)
    }
    background(0, 0, 14)

    requiredHeight = drawCardNames()

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 2)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    // debugCorner.showBottom()

    if (grayScreen) {
        // make the screen look darker
        noStroke()
        fill(0, 0, 0, 69)
        rect(0, 0, width, height)

        // display the detailed single-card stat UI
        displaySingleCardStatUI()

        if (mouseJustClicked) {
            grayScreen = false
        }
    }

    if (frameCount > 3000)
        noLoop()

    mouseJustClicked = false
    mouseJustClickedOnCard = false
}


function drawCardNames() {
    const FIRST_ROW_HEIGHT = 60
    const FIRST_COLUMN_WIDTH = 60
    const COLUMN_MARGIN = 10  // margin on either side, not total margin
    const GRADE_STRIP_WIDTH = 5
    const BETWEEN_CARD_LINE_MARGIN = 10
    const BETWEEN_CARD_NAME_MARGIN = 2
    const COLUMN_PADDING = 2
    const RARITY_STRIP_WIDTH = 5
    const RARITY_STRIP_MARGIN = 5
    const IMAGE_MARGIN = 10

    let hoverPhoto, hoverPhotoPos

    // first row/column light gray
    noStroke()

    // draw the first row and column
    fill(0, 0, 32)
    rect(0, 0, width, FIRST_ROW_HEIGHT)
    rect(0, 0, FIRST_COLUMN_WIDTH, height)

    stroke(BACKGROUND_COLOR)
    strokeWeight(3)
    noFill()
    line(0, FIRST_ROW_HEIGHT, width, FIRST_ROW_HEIGHT)

    // this contains the margin as well
    let columnWidth = (width - FIRST_COLUMN_WIDTH)/7 // 7 = number of columns

    // list of svgs/characters to display in each column
    let manaDisplaySymbols = [
        w, u, b, r, g, gold, c
    ]

    // list of all possible grades to display in each row
    let grades = [
        'S ', 'A+', 'A ', 'A-', 'B+', 'B ', 'B-', 'C+', 'C ', 'C-', 'D+', 'D ', 'D-', 'F '
    ]

    textFont(fixedWidthFont)

    // draw the column rectangles
    for (let i = 0; i < 7; i++) {
        let pos = i * columnWidth + FIRST_COLUMN_WIDTH
        noFill()
        strokeWeight(2)

        // find the center of the text and then display it completely centered
        let text_center = new p5.Vector(pos + columnWidth/2 + COLUMN_MARGIN/2,
            FIRST_ROW_HEIGHT/2)
        noStroke()
        fill(0, 0, 80)
        textSize(28)
        imageMode(CENTER)
        image(manaDisplaySymbols[i], text_center.x, text_center.y)
    }

    // required height of canvas
    let requiredHeight = 0

    // hardcoded constant for now
    let rowHeight = 35
    let nextRowPos = FIRST_ROW_HEIGHT

    // draw the row rectangles
    for (let i = 0; i < grades.length; i++) {
        let pos = nextRowPos

        textSize(18)
        textAlign(LEFT, TOP)

        // the longest set of card names
        let longestYDiff = 0

        textFont(variableWidthFont)

        // get ready to display text for each of the other color buckets
        for (let j = 0; j < Object.keys(cardBuckets).length; j++) {
            let color = Object.keys(cardBuckets)[j]
            let cardNameStartPos = new p5.Vector(
                j * columnWidth + COLUMN_MARGIN + FIRST_COLUMN_WIDTH + COLUMN_PADDING,
                pos + COLUMN_PADDING)

            let gradeBuckets = cardBuckets[color]
            let gradeData = gradeBuckets[grades[i]]
            // *2 because I have to account for both top and bottom column
            // padding
            let diffY = textDescent() + COLUMN_PADDING*2

            for (let k = 0; k < Object.keys(gradeData).length; k++) {
                let cardName = Object.keys(gradeData)[k]
                let cardNamePos = new p5.Vector(cardNameStartPos.x,
                    cardNameStartPos.y + diffY)
                diffY += textAscent() + BETWEEN_CARD_LINE_MARGIN

                noStroke()
                let wordList = cardName.split(" ")
                let wordPos = new p5.Vector(cardNamePos.x + RARITY_STRIP_WIDTH + RARITY_STRIP_MARGIN,
                    cardNamePos.y)
                let cardRectHeight = textAscent() + textDescent()

                // iterate once to find all the positions needed
                for (let word of wordList) {
                    word += " "
                    if ((textWidth(word) + wordPos.x + RARITY_STRIP_WIDTH + RARITY_STRIP_MARGIN) >=
                        (columnWidth + cardNamePos.x - COLUMN_PADDING)) {
                        wordPos.y += textAscent() + BETWEEN_CARD_NAME_MARGIN
                        diffY += textAscent() + BETWEEN_CARD_NAME_MARGIN
                        cardRectHeight += textAscent() + BETWEEN_CARD_NAME_MARGIN
                        wordPos.x = cardNamePos.x + RARITY_STRIP_MARGIN + RARITY_STRIP_WIDTH
                    }
                    wordPos.x += textWidth(word)
                }

                fill(0, 0, 25)

                rect(cardNamePos.x, cardNamePos.y,
                    columnWidth - COLUMN_PADDING*2 - COLUMN_MARGIN,
                    cardRectHeight)

                let rectRightEdge = cardNamePos.x + columnWidth -
                    COLUMN_PADDING*2 - COLUMN_MARGIN
                let rectBottom = cardNamePos.y + cardRectHeight

                switch (gradeData[cardName]["rarity"]) {
                    case ("common"):
                        fill(0, 0, 83)
                        break
                    case ("uncommon"):
                        fill(214, 14, 51)
                        break
                    case ("rare"):
                        fill(44, 55, 64)
                        break
                    case ("mythic"):
                        fill(11, 79, 74)
                        break
                }


                rect(cardNamePos.x, cardNamePos.y,
                    RARITY_STRIP_WIDTH,
                    cardRectHeight
                )

                fill(0, 0, 80)

                let currentlyHoveredOver = false

                // if the mouse is hovering over the text box, save the
                // text box's associated image
                if (
                    (mouseX > cardNamePos.x &&
                        mouseX < rectRightEdge) &&
                    (mouseY > cardNamePos.y &&
                        mouseY < rectBottom)
                ) {
                    let img = cardImages[cardName]
                    img.resize(300, 0)
                    imageMode(CORNER)
                    hoverPhotoPos = new p5.Vector(cardNamePos.x,
                        rectBottom + IMAGE_MARGIN)
                    hoverPhoto = img

                    if (hoverPhotoPos.x + 300 > width) {
                        hoverPhotoPos.x = hoverPhotoPos.x - (cardNamePos.x+300-width)
                    }

                    if (hoverPhotoPos.y + img.height > windowHeight + scrollY) {
                        let diff = hoverPhotoPos.y + img.height - (windowHeight + scrollY)

                        hoverPhotoPos.y = hoverPhotoPos.y - diff
                    }

                    fill(32, 97, 85)
                    currentlyHoveredOver = true

                    // if the mouse also just clicked on a card, print its name
                    if (mouseJustClicked) {
                        print(cardName + " was clicked on")
                        if (!grayScreen) {
                            cardClickedData = gradeData[cardName]
                            cardClickedData["name"] = cardName.slice()
                            print("cardName:", cardName)
                            print("cardClickedData:", cardClickedData)
                        }
                        grayScreen = !grayScreen
                        mouseJustClickedOnCard = true
                        mouseJustClicked = false
                    }
                }

                wordPos = new p5.Vector(cardNamePos.x + RARITY_STRIP_WIDTH + RARITY_STRIP_MARGIN,
                    cardNamePos.y)

                // iterate again to actually display the words
                for (let word of wordList) {
                    word += " "

                    // find the next word and calculate if I should add a
                    // space to the current word
                    let nextWord = wordList[wordList.indexOf(word) + 1] + " "
                    let wordWidth = textWidth(word)
                    let nextWordWidth = textWidth(nextWord)

                    if ((wordWidth + wordPos.x + RARITY_STRIP_WIDTH + RARITY_STRIP_MARGIN) >=
                        (columnWidth + cardNamePos.x - COLUMN_PADDING)) {
                        wordPos.y += textAscent() + BETWEEN_CARD_NAME_MARGIN
                        wordPos.x = cardNamePos.x + RARITY_STRIP_WIDTH + RARITY_STRIP_MARGIN
                    }

                    // calculate if the next word will wrap
                    else if ((wordWidth + nextWordWidth + wordPos.x + RARITY_STRIP_WIDTH + RARITY_STRIP_MARGIN) >=
                        (columnWidth + cardNamePos.x - COLUMN_PADDING)) {
                        // if so, then remove the space from the word width
                        wordWidth -= textWidth(" ")
                    }

                    // if the text was hovered over, underline it with a
                    // line under the entire word
                    if (currentlyHoveredOver) {
                        stroke(32, 97, 85) // hovered text color
                        strokeWeight(2)
                        line(
                            wordPos.x, wordPos.y + textAscent(),
                            wordPos.x + wordWidth, wordPos.y + textAscent()
                        )

                        noStroke()
                    }

                    text(word, wordPos.x, wordPos.y)

                    wordPos.x += textWidth(word)
                }
            }

            if (longestYDiff < diffY) {
                longestYDiff = diffY
            }
        }

        let currentRowHeight = longestYDiff + rowHeight

        noStroke()
        fill(137 - 11*i, 82, 77)

        textFont(fixedWidthFont)

        rect(0, pos,
            GRADE_STRIP_WIDTH, currentRowHeight
        )

        strokeWeight(2)
        stroke(BACKGROUND_COLOR)
        noFill()

        rect(-20, pos,
             width + 60, currentRowHeight
        )

        // compute the text center and display the text, left-aligned. I used
        // stroke to bold the text.
        let text_center = new p5.Vector(FIRST_COLUMN_WIDTH/3,
            pos + currentRowHeight/2)

        textAlign(LEFT, CENTER)
        textSize(22)

        stroke(0, 0, 80)
        strokeWeight(0.8)
        fill(0, 0, 80)

        text(grades[i], text_center.x, text_center.y)

        requiredHeight += currentRowHeight
        nextRowPos += currentRowHeight
    }

    // makes sure that photos don't display when the screen is supposed to be
    // grayed out
    if (hoverPhoto && !grayScreen) {
        image(hoverPhoto, hoverPhotoPos.x, hoverPhotoPos.y)
    }

    return requiredHeight + FIRST_ROW_HEIGHT
}


function displaySingleCardStatUI() {
    // rect margin should be based on height/width
    const SIDE_MARGIN = width/10
    const VERTICAL_MARGIN = windowHeight/10
    const LEFT_HEADER_MARGIN = 30
    const VERTICAL_HEADER_MARGIN = 30

    // window width and height
    const WIDTH = width - (SIDE_MARGIN*2)
    const HEIGHT = windowHeight - (VERTICAL_MARGIN*2)

    // top margin of stat/card display
    const DECK_ANALYSIS_TOP_MARGIN = 40
    const CARD_TOP_MARGIN = 25
    const CARD_WIDTH = 340

    // width-to-widgetWidth ratios in 17L
    // deck analysis widget width
    const DECK_ANALYSIS_PROPORTION = 45/100
    // all widget height
    const WIDGET_HEIGHT_PROPORTION = 5.6/8
    // gray rectangle in deck analysis widget width
    const GRAY_RECT_PROPORTION = 17/45

    // translate so that I don't have to add the side margin and
    // scrollY+vertical margin every time I want to draw something, as I'll be
    // drawing a lot of widgets on this.
    push()
    translate(SIDE_MARGIN, scrollY + VERTICAL_MARGIN)

    // background for detailed stat screen
    fill(0, 0, 9)
    rect(0, 0, WIDTH, HEIGHT, 15)

    print(cardClickedData["name"])

    // window header (card name)
    textFont(variableWidthFont)
    textSize(30)
    textAlign(LEFT, TOP)
    fill(0, 0, 80)
    noStroke()
    text(cardClickedData["name"], LEFT_HEADER_MARGIN, VERTICAL_HEADER_MARGIN)

    // line separating window header and the rest of the card widgets. Has to
    // account for text height.
    stroke(0, 0, 0)
    strokeWeight(1)
    // *2 because I'm accounting for both top and bottom margin of the text
    // header
    line(0, VERTICAL_HEADER_MARGIN*2 + textAscent(),
        WIDTH, VERTICAL_HEADER_MARGIN*2 + textAscent()
    )

    translate(LEFT_HEADER_MARGIN,
        VERTICAL_HEADER_MARGIN*2 + textAscent() + DECK_ANALYSIS_TOP_MARGIN
    )



    /* card image */
    imageMode(CORNER)
    let img = detailedCardWindowImages[cardClickedData["name"]]
    img.resize(CARD_WIDTH, 0)
    image(img, 0, textAscent() + CARD_TOP_MARGIN)

    let imgWidth = img.width

    // set the remaining space
    let remainingSpace = WIDTH - imgWidth - LEFT_HEADER_MARGIN*2

    translate(imgWidth + LEFT_HEADER_MARGIN, 0)



    /* "Deck Analysis" widget */
    noStroke()
    textSize(22)
    text("Deck Analysis", 0, 0)

    let deckAnalysisWidth = remainingSpace * DECK_ANALYSIS_PROPORTION

    stroke(0, 0, 0)
    noFill()
    strokeWeight(1)
    rect(0, textAscent() + CARD_TOP_MARGIN,
        deckAnalysisWidth, HEIGHT*WIDGET_HEIGHT_PROPORTION)

    fill(0, 0, 14)
    noStroke()
    rect(0, textAscent() + CARD_TOP_MARGIN,
        deckAnalysisWidth*GRAY_RECT_PROPORTION, HEIGHT*WIDGET_HEIGHT_PROPORTION)

    // height of one cell in the deck analysis
    let cellHeight = HEIGHT * WIDGET_HEIGHT_PROPORTION/5

    // draw color pairs and their respective winrates, starting at "AVG/ALL"
    textAlign(CENTER, TOP)
    fill(0, 0, 80)
    noStroke()
    text("AVG", deckAnalysisWidth*GRAY_RECT_PROPORTION/2,
        textAscent() + CARD_TOP_MARGIN + cellHeight/2
    )
    text(round(cardClickedData["stats"]["all"]["all"]["GIH WR"] * 100),
        // the middle, or average, of the space between the right edges of the
        // deck analysis widget and the gray rectangle within
        (deckAnalysisWidth + (deckAnalysisWidth*GRAY_RECT_PROPORTION))/2,
        textAscent() + CARD_TOP_MARGIN + cellHeight/2)



    translate(deckAnalysisWidth + LEFT_HEADER_MARGIN, 0)

    /* "More 17L Stats" widget, but not all 17L stats */
    noStroke()
    fill(0, 0, 80)
    textAlign(LEFT, TOP)
    text("More 17L Stats", 0, 0)

    stroke(0, 0, 0)
    noFill()
    strokeWeight(1)
    // calculate remaining space left to use
    rect(0,
        textAscent() + CARD_TOP_MARGIN,
        remainingSpace-(remainingSpace*DECK_ANALYSIS_PROPORTION)-LEFT_HEADER_MARGIN*2,
        HEIGHT*WIDGET_HEIGHT_PROPORTION)

    pop()
}


function keyPressed() {
    /* stop sketch */
    if (keyCode === 97) { /* numpad 1 */
        noLoop()
        instructions.html(`<pre>
            sketch stopped</pre>`)
    }

    if (key === '`') { /* toggle debug corner visibility */
        debugCorner.visible = !debugCorner.visible
        console.log(`debugCorner visibility set to ${debugCorner.visible}`)
    }
}


function mouseClicked() {
    mouseJustClicked = true
}


/** 🧹 shows debugging info using text() 🧹 */
class CanvasDebugCorner {
    constructor(lines) {
        this.visible = true
        this.size = lines
        this.debugMsgList = [] /* initialize all elements to empty string */
        for (let i in lines)
            this.debugMsgList[i] = ''
    }

    setText(text, index) {
        if (index >= this.size) {
            this.debugMsgList[0] = `${index} ← index>${this.size} not supported`
        } else this.debugMsgList[index] = text
    }

    showBottom() {
        if (this.visible) {
            noStroke()
            textFont(fixedWidthFont, 14)

            const LEFT_MARGIN = 10
            const DEBUG_Y_OFFSET = height - 10 /* floor of debug corner */
            const LINE_SPACING = 2
            const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

            /* semi-transparent background */
            fill(0, 0, 0, 10)
            rectMode(CORNERS)
            const TOP_PADDING = 3 /* extra padding on top of the 1st line */
            rect(
                0,
                height,
                width,
                DEBUG_Y_OFFSET - LINE_HEIGHT * this.debugMsgList.length - TOP_PADDING
            )

            fill(0, 0, 100, 100) /* white */
            strokeWeight(0)

            for (let index in this.debugMsgList) {
                const msg = this.debugMsgList[index]
                text(msg, LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT * index)
            }
        }
    }

    showTop() {
        if (this.visible) {
            noStroke()
            textFont(fixedWidthFont, 14)

            const LEFT_MARGIN = 10
            const TOP_PADDING = 3 /* extra padding on top of the 1st line */

            /* offset from top of canvas */
            const DEBUG_Y_OFFSET = textAscent() + TOP_PADDING
            const LINE_SPACING = 2
            const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

            /* semi-transparent background, a console-like feel */
            fill(0, 0, 0, 10)
            rectMode(CORNERS)

            rect( /* x, y, w, h */
                0,
                0,
                width,
                DEBUG_Y_OFFSET + LINE_HEIGHT*this.debugMsgList.length/*-TOP_PADDING*/
            )

            fill(0, 0, 100, 100) /* white */
            strokeWeight(0)

            textAlign(LEFT)
            for (let i in this.debugMsgList) {
                const msg = this.debugMsgList[i]
                text(msg, LEFT_MARGIN, LINE_HEIGHT*i + DEBUG_Y_OFFSET)
            }
        }
    }
}
