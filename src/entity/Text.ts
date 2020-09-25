import Sprite from "./Sprite"
import Graphics from "../resources/Graphics"
import Texture from "../resources/Texture"

class Text extends Sprite {
    _lineBuffer: Array<string> = [ "" ]
    _wordBuffer: Array<Array<string>> = null
    _text: string = ""
    _limitWidth: number = 0
    _maxWidth: number = 0
    _font: string = "Tahoma"
    _fontSize: number = 12
    _fontSizePx: string = `12px`
    _fontColor: string = "#000"
    _style: string = ""
    _outline: boolean = false
    _outlineColor: string = "#000"
    _outlineWidth: number = 1
    _shadow: boolean = false
    _shadowColor: string = "#000"
    _shadowBlur: number = 3
    _shadowOffsetX: number = 0
    _shadowOffsetY: number = 0

    constructor(text: string = "") {
        super()
        this.texture = new Graphics()
        this.texture._minFilter = Texture.NEAREST
        this.texture._magFilter = Texture.NEAREST
        this.text = text
    }

    updateMesh() {
        const ctx = this._texture.ctx 
        ctx.font = this._style + " " + this._fontSizePx + " " + this._font
        
        const newlineIndex = this._text.indexOf("\n")
        if(newlineIndex !== -1) {
            this._lineBuffer = this._text.split("\n")
        }
        else {
            this._lineBuffer.length = 1
            this._lineBuffer[0] = this._text
        }

        this._maxWidth = 0
        if(this._limitWidth > 0) {
            this.calcLineBuffer()
        }
        else {
            for(let n = 0; n < this._lineBuffer.length; n++) {
                const metrics = ctx.measureText(this._lineBuffer[n])
                if(metrics.width > this._maxWidth) {
                    this._maxWidth = metrics.width
                }
            }
        }

        let posX = 0
        let posY = 0

        if(this._shadow) {
            this._maxWidth += this._shadowBlur * 2
            posX += this._shadowBlur
        }

        const fontHeight = this._fontSize * 1.3
        const width = Math.ceil(this._maxWidth)
        const height = Math.ceil(fontHeight * this._lineBuffer.length)
        this.size.set(width, height)
        this._texture.resize(width, height)

        ctx.clearRect(0, 0, this._texture.width, this._texture.height)
        ctx.font = this._style + " " + this._fontSizePx + " " + this._font
        ctx.fillStyle = this._fontColor
        ctx.textBaseline = "top"

        if(this._shadow) {
            ctx.shadowColor = this._shadowColor
            ctx.shadowOffsetX = this._shadowOffsetX
            ctx.shadowOffsetY = this._shadowOffsetY
            ctx.shadowBlur = this._shadowBlur
        }
        if(this._outline) {
            ctx.lineWidth = this._outlineWidth
            ctx.strokeStyle = this._outlineColor
        }		

        for(let n = 0; n < this._lineBuffer.length; n++) {
            if(this._outline) {
                ctx.strokeText(this._lineBuffer[n], posX, posY)
            }

            ctx.fillText(this._lineBuffer[n], posX, posY)

            posY += fontHeight
        }

        if(width > 0) {
            this._texture.needUpdate = true
            this._frame = null
            this.frame = this._texture.getFrame("0")
            super.updateMesh()
        }
        else {
            this._size.set(0, height)
        }
        this.needUpdateMesh = false
    }

    calcLineBuffer() {
        const lineBuffer = []
        const ctx = this._texture.ctx
        let text = ""
        let width = 0

        this._wordBuffer.length = this._lineBuffer.length
        for(let n = 0; n < this._lineBuffer.length; n++) {
            this._wordBuffer[n] = this._lineBuffer[n].split(" ")
        }

        for(let n = 0; n < this._lineBuffer.length; n++) {
            const words = this._wordBuffer[n]
    
            if(words.length === 1) {
                const word = words[0]
                const metrics = ctx.measureText(word)

                if(metrics.width > this._maxWidth) {
                    this._maxWidth = metrics.width
                }
                lineBuffer.push(word)
            }
            else {
                for(let i = 0; i < words.length; i++) {
                    const word = words[i]

                    let metrics
                    if(text) {
                        metrics = ctx.measureText(" " + word)
                    }
                    else {
                        metrics = ctx.measureText(word)
                    }

                    if((width + metrics.width) > this._limitWidth) {
                        lineBuffer.push(text);
                        if(this._maxWidth < width) {
                            this._maxWidth = width
                        }

                        if(i === (words.length - 1)) {
                            lineBuffer.push(word)
                            if(this._maxWidth < metrics.width) {
                                this._maxWidth = metrics.width
                            }

                            width = 0
                            text = null							
                        }
                        else {
                            text = word
                            width = metrics.width
                        }
                    }
                    else {
                        if(text) {
                            text += " " + word
                        }
                        else {
                            text = word
                        }

                        if(i === (words.length - 1)) {
                            lineBuffer.push(text)
                            if(this._maxWidth < (width + metrics.width)) {
                                this._maxWidth = width + metrics.width
                            }

                            text = null
                            width = 0			
                        }
                        else {
                            width += metrics.width
                        }
                    }
                }
            }
        }	

        this._lineBuffer = lineBuffer
    }

    set text(text) {
        if(text === undefined) {
            text = ""
        }
        if(this._text === text) {
            return
        }
        this._text = text
        this._lineBuffer[0] = text
        this.needUpdateMesh = true
    }

    get text() {
        return this._text
    }

    set font(font) {
        if(this._font === font) { 
            return 
        }
        this._font = font
        this.needUpdateMesh = true
    }

    get font() {
        return this._font
    }

    set fontSize(size) {
        if(this._fontSize === size) { 
            return 
        }
        this._fontSize = size
        this._fontSizePx = `${size}px`
        this.needUpdateMesh = true
    }

    get fontSize() {
        return this._fontSize
    }

    set fontColor(fontColor) {
        if(this._fontColor === fontColor) { 
            return 
        }
        this._fontColor = fontColor
        this.needUpdateMesh = true
    }

    get fontColor() {
        return this._fontColor
    }

    set style(style) { 
        if(this._style === style) { 
            return 
        }
        this._style = style
        this.needUpdateMesh = true
    }

    get style() { 
        return this._style 
    }

    set outlineColor(color) { 
        if(this._outlineColor === color) { 
            return 
        }
        this._outlineColor = color
        this._outline = true
        this.needUpdateMesh = true
    }

    get outlineColor() { 
        return this._outlineColor 
    }

    set outlineWidth(width) { 
        if(this._outlineWidth === width) { 
            return 
        }
        this._outlineWidth = width
        this._outline = true
        this.needUpdateMesh = true
    }

    get outlineWidth() { 
        return this._outlineWidth 
    }

    set outline(value) {
        if(this._outline === value) { 
            return 
        }
        this._outline = value
        this.needUpdateMesh = true
    }

    get outline() { 
        return this._outline 
    }	

    set shadow(shadow) {
        if(this._shadow === shadow) { 
            return 
        }
        this._shadow = shadow
        this.needUpdateMesh = true
    }

    get shadow() {
        return this._shadow
    }

    set shadowColor(color) {
        if(this._shadowColor === color) { 
            return 
        }
        this._shadowColor = color
        this.needUpdateMesh = true
    }

    get shadowColor() {
        return this._shadowColor
    }

    set shadowOffsetX(offsetX) {
        if(this._shadowOffsetX === offsetX) { 
            return 
        }
        this._shadowOffsetX = offsetX
        this.needUpdateMesh = true
    }

    set shadowOffsetY(offsetY) {
        if(this._shadowOffsetY === offsetY) { 
            return 
        }
        this._shadowOffsetY = offsetY
        this.needUpdateMesh = true
    }

    get shadowOffsetX() {
        return this._shadowOffsetX
    }

    get shadowOffsetY() {
        return this._shadowOffsetY
    }

    set limitWidth(value) {
        if(this._limitWidth === value) { 
            return 
        }
        this._limitWidth = value
        if(value === 0) {
            this._wordBuffer = null
        }
        else {
            this._wordBuffer = []
        }
        this.needUpdateMesh = true
    }

    get limitWidth() {
        return this._limitWidth
    }	
}

export default Text