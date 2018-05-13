
const numberOfBins = 256
const bucket = new Array(numberOfBins)
const startOfBin = new Array(numberOfBins)
const endOfBin = new Array(numberOfBins)
const radix = 8

const extractDigit = function(a, bitMask, shiftRightAmount) {
    const digit = (a & bitMask) >>> shiftRightAmount
    return digit
}

const radixSortLSD = function(input, output, count) {
    let outputResult = false
    let bitMask = 255
    let shiftRightAmount = 0

    if(output.length < input.length) {
        output.length = input.length
    }

    while(bitMask != 0) {
        for(let n = 0; n < numberOfBins; n++) {
			bucket[n] = 0
		}
        for(let n = 0; n < count; n++) {
			const digit = (input[n].key & bitMask) >>> shiftRightAmount
			bucket[digit]++
		}
            
        startOfBin[0] = endOfBin[0] = 0
        for(let n = 1; n < numberOfBins; n++)
            startOfBin[n] = endOfBin[n] = startOfBin[n - 1] + bucket[n - 1]
        for(let n = 0; n < count; n++) {
			const digit = (input[n].key & bitMask) >>> shiftRightAmount
			output[endOfBin[digit]++] = input[n]
		}
		
        bitMask <<= radix
        shiftRightAmount += radix
        outputResult = !outputResult
 
		let tmp = input
		input = output
		output = tmp
	}
	
    if(outputResult) {
        for(let n = 0; n < output; n++) {
			input[n] = output[n]
		}
	}
}

export default radixSortLSD