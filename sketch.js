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


function preload() {
    font = loadFont('data/consola.ttf')
    fixedWidthFont = loadFont('data/consola.ttf')
    variableWidthFont = loadFont('data/meiryo.ttf')

    masterJSON = loadJSON('master.json')
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
        }
    }

    for (let cardName of Object.keys(masterJSON)) {
        let card = masterJSON[cardName]

        let cardGrade

        if (card["stats"]["all"]["all"])
            cardGrade = card["stats"]["all"]["all"]["GIH grade"]
        else
            continue

        if (card["color"] === "") {
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
}


function draw() {
    resizeCanvas(windowWidth - 40, requiredHeight)
    background(0, 0, 14)

    requiredHeight = drawCardNames()

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 2)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    // debugCorner.showBottom()

    if (frameCount > 3000)
        noLoop()
}


function drawCardNames() {
    const FIRST_ROW_HEIGHT = 60
    const FIRST_COLUMN_WIDTH = 60
    const COLUMN_MARGIN = 10  // margin on either side, not total margin
    const COLOR_WIDTH = 5
    const INLINE_MARGIN = 4

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
        'W',
        'U',
        'B',
        'R',
        'G',
        'GOLD',
        'C'
    ]

    // list of all possible grades to display in each row
    let grades = [
        'S ',
        'A+',
        'A ',
        'A-',
        'B+',
        'B ',
        'B-',
        'C+',
        'C ',
        'C-',
        'D+',
        'D ',
        'D-',
        'F '
    ]

    // draw the column rectangles
    for (let i = 0; i < 7; i++) {
        let pos = i * columnWidth + FIRST_COLUMN_WIDTH
        noFill()
        strokeWeight(2)
        stroke(0, 0, 40 + 6*i)
        rect(pos + COLUMN_MARGIN, 0,
            columnWidth - COLUMN_MARGIN, height
        )

        // find the center of the text and then display it completely centered
        let text_center = new p5.Vector(pos + columnWidth/2 + COLUMN_MARGIN/2, FIRST_ROW_HEIGHT/2)
        noStroke()
        fill(0, 0, 80)
        textSize(28)
        textAlign(CENTER, CENTER)
        text(manaDisplaySymbols[i], text_center.x, text_center.y)
    }

    // required height of canvas
    let requiredHeight = 0

    // hardcoded constant for now
    let rowHeight = 35
    let nextRowPos = FIRST_ROW_HEIGHT

    // draw the row rectangles
    for (let i = 0; i < grades.length; i++) {
        let pos = nextRowPos

        textSize(15)
        textAlign(LEFT, TOP)

        // the longest set of card names
        let longestBucketLength = 0

        // get ready to display text for each of the other color buckets
        for (let j = 0; j < Object.keys(cardBuckets).length; j++) {
            let color = Object.keys(cardBuckets)[j]
            let cardNameStartPos = new p5.Vector(
                j * columnWidth + COLUMN_MARGIN + FIRST_COLUMN_WIDTH,
                pos)

            let gradeBuckets = cardBuckets[color]
            let gradeData = gradeBuckets[grades[i]]

            for (let k = 0; k < Object.keys(gradeData).length; k++) {
                let cardName = Object.keys(gradeData)[k]

                let cardNamePos = new p5.Vector(cardNameStartPos.x,
                    cardNameStartPos.y + (textAscent() + INLINE_MARGIN)*k)

                noStroke()
                text(cardName, cardNamePos.x, cardNamePos.y)
            }

            if (longestBucketLength < Object.keys(gradeData).length) {
                longestBucketLength = Object.keys(gradeData).length
            }
        }

        let currentRowHeight = longestBucketLength * (textAscent() + INLINE_MARGIN) + rowHeight

        noStroke()
        fill(137 - 11*i, 82, 77)

        rect(0, pos,
            COLOR_WIDTH, currentRowHeight
        )

        strokeWeight(2)
        stroke(BACKGROUND_COLOR)
        noFill()

        rect(-20, pos,
             width + 60, currentRowHeight
        )

        // compute the text center and display the text, left-aligned. I used
        // stroke to bold the text.
        let text_center = new p5.Vector(FIRST_COLUMN_WIDTH/3, pos + currentRowHeight/2)

        textAlign(LEFT, CENTER)
        textSize(22)

        stroke(0, 0, 80)
        strokeWeight(0.8)
        fill(0, 0, 80)

        text(grades[i], text_center.x, text_center.y)

        requiredHeight += currentRowHeight
        nextRowPos += currentRowHeight
    }

    return requiredHeight + FIRST_ROW_HEIGHT
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
